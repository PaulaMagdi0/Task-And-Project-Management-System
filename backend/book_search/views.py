from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .utils import search_books

@csrf_exempt
def search_books_view(request):
    query = request.GET.get('query', '')
    max_results = request.GET.get('max_results', 10)
    try:
        max_results = int(max_results)
    except ValueError:
        max_results = 10  # Default value if max_results is not a valid number

    if query:
        books_df = search_books(query, max_results)
        if books_df is not None:
            return JsonResponse(books_df.to_dict(orient='records'), safe=False)
        else:
            return JsonResponse({"error": "Error fetching books"}, status=500)
    else:
        return JsonResponse({"error": "No query parameter provided"}, status=400)
