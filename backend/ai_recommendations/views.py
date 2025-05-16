# ai_recommendations/views.py

from django.http import JsonResponse
from django.core.cache import cache
from apps.assignments.models import Assignment
from apps.courses.models import Course
from transformers import BertTokenizer, BertModel
import torch
from sklearn.metrics.pairwise import cosine_similarity
import logging

# Set up logging
logger = logging.getLogger(__name__)

# Load pre-trained BERT model and tokenizer (CPU only)
tokenizer = BertTokenizer.from_pretrained('bert-base-uncased')
device = torch.device("cpu")
model = BertModel.from_pretrained('bert-base-uncased').to(device)

# ========== Utilities ==========

def get_embeddings(texts):
    inputs = tokenizer(texts, padding=True, truncation=True, return_tensors="pt").to(device)
    with torch.no_grad():
        outputs = model(**inputs)
    embeddings = outputs.last_hidden_state.mean(dim=1)
    return embeddings

def fetch_assignments_and_embeddings():
    assignments = Assignment.objects.all()
    if not assignments.exists():
        return [], torch.empty(0)
    
    descriptions = [a.description for a in assignments]
    embeddings = get_embeddings(descriptions)
    return assignments, embeddings

def refresh_embeddings():
    """Refresh the assignments queryset and their corresponding embeddings in cache."""
    assignments_queryset, assignments_embeddings = fetch_assignments_and_embeddings()
    cache.set('assignments_queryset', list(assignments_queryset))
    cache.set('assignments_embeddings', assignments_embeddings)

def get_cached_embeddings():
    assignments_queryset = cache.get('assignments_queryset', [])
    assignments_embeddings = cache.get('assignments_embeddings', None)
    return assignments_queryset, assignments_embeddings

# Fetch assignments and embeddings ONCE initially
# try:
#     from apps.assignments.models import Assignment
#     if Assignment.objects.exists():
#         refresh_embeddings()
# except Exception as e:
#     print(f"[WARNING] Couldn't refresh embeddings at startup: {e}")

# ========== Recommendation Logic ==========

def recommend_using_course_and_difficulty(course_name, difficulty, intake_name=None, top_n=3):
    try:
        # Start with a query for the course name
        query = Course.objects.filter(name__iexact=course_name.strip())
        
        # If intake_name is provided, filter by intake
        if intake_name:
            query = query.filter(intake__name__iexact=intake_name.strip())
        
        course = query.first()  # Get the first matching course
        if not course:
            logger.error(f"No course found with the name: {course_name} and intake: {intake_name or 'Any'}")
            return f"❌ No course found with the name: {course_name} and intake: {intake_name or 'Any'}"
    
    except Course.DoesNotExist:
        logger.error(f"No course found with the name: {course_name} and intake: {intake_name or 'Any'}")
        return f"❌ No course found with the name: {course_name} and intake: {intake_name or 'Any'}"

    filtered_assignments = Assignment.objects.filter(
        course=course,
        difficulty__iexact=difficulty.strip()
    ).order_by('-created_at')[:top_n]

    if not filtered_assignments.exists():
        logger.warning(f"No assignments found for course '{course_name}' with difficulty '{difficulty}' and intake '{intake_name or 'Any'}'")
        return f"⚠️ No assignments found for course '{course_name}' with difficulty '{difficulty}' and intake '{intake_name or 'Any'}'"

    return filtered_assignments
def recommend_based_on_brief(brief_description, top_n=3):
    if not brief_description.strip():
        return f"⚠️ Brief description is empty."

    assignments_queryset, assignments_embeddings = get_cached_embeddings()

    if assignments_embeddings is None or len(assignments_queryset) == 0:
        logger.warning("No assignments available for recommendation.")
        return f"⚠️ No assignments available for recommendation."

    brief_embedding = get_embeddings([brief_description])
    sim_scores = cosine_similarity(
        brief_embedding.detach().numpy(),
        assignments_embeddings.detach().numpy()
    )[0]

    top_indices = sim_scores.argsort()[-top_n:][::-1]
    assignments_list = list(assignments_queryset)
    recommended_assignments = [assignments_list[i] for i in top_indices]

    return recommended_assignments

# ========== API View ==========

def get_recommendations(request):
    method_choice = request.GET.get("method_choice", "1")  # "1" for Course+Difficulty, "2" for Brief Description
    top_n = int(request.GET.get("top_n", 4))

    # Auto-refresh if assignments count changed
    cached_assignments, _ = get_cached_embeddings()
    # if Assignment.objects.count() != len(cached_assignments):
    #     refresh_embeddings()

    if method_choice == "1":
        course_name = request.GET.get("course_name", "Java")
        difficulty = request.GET.get("difficulty", "Easy")
        intake_name = request.GET.get("intake_name", None)  # Get intake_name, default to None
        recommendations = recommend_using_course_and_difficulty(course_name, difficulty, intake_name, top_n=top_n)
    elif method_choice == "2":
        brief_description = request.GET.get("brief_description", "web app using django")
        recommendations = recommend_based_on_brief(brief_description, top_n=top_n)
    else:
        logger.error("Invalid method choice.")
        return JsonResponse({"error": "Invalid method choice."}, status=400)

    if isinstance(recommendations, str):
        return JsonResponse({"error": recommendations}, status=400)

    recommended_list = []
    for rec in recommendations:
        recommended_list.append({
            "title": rec.title,
            "description": rec.description,
            "course_name": rec.course.name,
            "difficulty": rec.difficulty,
            "intake_name": rec.course.intake.name if rec.course.intake else "No Intake",
        })

    return JsonResponse({"recommendations": recommended_list})