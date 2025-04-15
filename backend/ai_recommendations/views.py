# ai_recommendations/views.py
from django.http import JsonResponse
from .models import Recommendation
import pandas as pd
from transformers import BertTokenizer, BertModel
import torch
from sklearn.metrics.pairwise import cosine_similarity

import os
print(os.getcwd())  # This will print the current working directory

# Load CSV files Windows
# assignments = pd.read_csv('E:/Graduation Project ITI/Task-And-Project-Management-System/backend/data/assignments.csv')
# courses = pd.read_csv('E:/Graduation Project ITI/Task-And-Project-Management-System/backend/data/courses.csv')
# Load CSV Files Linux
assignments = pd.read_csv('data/assignments.csv')
courses = pd.read_csv('data/courses.csv')

# Load pre-trained BERT model and tokenizer (CPU only)
tokenizer = BertTokenizer.from_pretrained('bert-base-uncased')
device = torch.device("cpu")
model = BertModel.from_pretrained('bert-base-uncased').to(device)

def get_embeddings(texts):
    inputs = tokenizer(texts, padding=True, truncation=True, return_tensors="pt").to(device)
    with torch.no_grad():
        outputs = model(**inputs)
    embeddings = outputs.last_hidden_state.mean(dim=1)
    return embeddings

# Precompute embeddings for all assignment descriptions
assignments_embeddings = get_embeddings(assignments['description'].tolist())

def recommend_using_course_and_difficulty(course_name, difficulty, top_n=3):
    course_name_clean = course_name.strip().lower()
    difficulty_clean = difficulty.strip().lower()
    valid_courses = courses[courses['course_name'].str.strip().str.lower() == course_name_clean]
    if valid_courses.empty:
        return f"❌ No course found with the name: {course_name}"

    filtered_assignments = assignments[
        (assignments['course_id'].isin(valid_courses['course_id'])) &
        (assignments['difficulty'].str.strip().str.lower() == difficulty_clean)
    ]
    if filtered_assignments.empty:
        return f"⚠️ No assignments found for course '{course_name}' with difficulty '{difficulty}'"
    return filtered_assignments.head(top_n)

def recommend_based_on_brief(brief_description, top_n=3):
    brief_embedding = get_embeddings([brief_description])
    sim_scores = cosine_similarity(brief_embedding.detach().numpy(), assignments_embeddings.detach().numpy())[0]
    top_indices = sim_scores.argsort()[-top_n:][::-1]
    return assignments.iloc[top_indices]

def get_recommendations(request):
    method_choice = request.GET.get("method_choice", "1")  # "1" for Course+Difficulty, "2" for Brief Description

    if method_choice == "1":
        course_name = request.GET.get("course_name", "Java")
        difficulty = request.GET.get("difficulty", "Easy")
        recommendations = recommend_using_course_and_difficulty(course_name, difficulty)
    elif method_choice == "2":
        brief_description = request.GET.get("brief_description", "web app using django")
        recommendations = recommend_based_on_brief(brief_description)

    if isinstance(recommendations, str):
        return JsonResponse({"error": recommendations}, status=400)

    recommended_list = []
    for rec in recommendations.itertuples():
        recommended_list.append({
            "title": rec.title,
            "description": rec.description,
            "course_name": courses[courses['course_id'] == rec.course_id].iloc[0]['course_name'],
            "difficulty": rec.difficulty
        })

    return JsonResponse({"recommendations": recommended_list})

