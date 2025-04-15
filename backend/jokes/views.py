import requests
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

class JokeAPIView(APIView):
    def get(self, request, *args, **kwargs):
        # JokeAPI endpoint
        url = "https://v2.jokeapi.dev/joke/Programming?format=json"
        response = requests.get(url)

        if response.status_code == 200:
            data = response.json()
            if data['type'] == 'single':
                return Response({"joke": data['joke']})
            elif data['type'] == 'twopart':
                return Response({
                    "setup": data['setup'],
                    "delivery": data['delivery']
                })
        return Response({"error": "Failed to fetch joke"}, status=status.HTTP_400_BAD_REQUEST)
