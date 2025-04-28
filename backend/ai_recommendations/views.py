# ai_recommendations/views.py

from django.http import JsonResponse
from apps.assignments.models import Assignment
from apps.courses.models import Course
from transformers import BertTokenizer, BertModel
import torch
from sklearn.metrics.pairwise import cosine_similarity

# Load pre-trained BERT model and tokenizer (CPU only)
tokenizer = BertTokenizer.from_pretrained('bert-base-uncased')
device = torch.device("cpu")
model = BertModel.from_pretrained('bert-base-uncased').to(device)

# Initialize global variables
assignments_queryset = []
assignments_embeddings = None

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
    """Refresh the assignments queryset and their corresponding embeddings."""
    global assignments_queryset, assignments_embeddings
    assignments_queryset, assignments_embeddings = fetch_assignments_and_embeddings()

# Fetch assignments and embeddings ONCE initially
refresh_embeddings()

def recommend_using_course_and_difficulty(course_name, difficulty, top_n=3):
    try:
        course = Course.objects.get(name__iexact=course_name.strip())
    except Course.DoesNotExist:
        return f"❌ No course found with the name: {course_name}"

    filtered_assignments = Assignment.objects.filter(
        course=course,
        difficulty__iexact=difficulty.strip()
    ).order_by('-created_at')[:top_n]

    if not filtered_assignments.exists():
        return f"⚠️ No assignments found for course '{course_name}' with difficulty '{difficulty}'"

    return filtered_assignments

def recommend_based_on_brief(brief_description, top_n=3):
    if assignments_embeddings is None or len(assignments_queryset) == 0:
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

def get_recommendations(request):
    method_choice = request.GET.get("method_choice", "1")  # "1" for Course+Difficulty, "2" for Brief Description
    top_n = int(request.GET.get("top_n", 3))  # Allow passing top_n optionally

    if method_choice == "1":
        course_name = request.GET.get("course_name", "Java")
        difficulty = request.GET.get("difficulty", "Easy")
        recommendations = recommend_using_course_and_difficulty(course_name, difficulty, top_n=top_n)
    elif method_choice == "2":
        brief_description = request.GET.get("brief_description", "web app using django")
        recommendations = recommend_based_on_brief(brief_description, top_n=top_n)
    else:
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
        })

    return JsonResponse({"recommendations": recommended_list})
