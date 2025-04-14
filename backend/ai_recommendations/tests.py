# ai_recommendations/tests.py
from django.test import TestCase
from django.urls import reverse

class RecommendationTestCase(TestCase):
    def test_get_recommendations_by_course_and_difficulty(self):
        url = reverse('get_recommendations')
        response = self.client.get(url, {
            'method_choice': '1',
            'course_name': 'Java',
            'difficulty': 'Easy'
        })
        self.assertEqual(response.status_code, 200)
        self.assertIn('recommendations', response.json())

    def test_get_recommendations_by_brief_description(self):
        url = reverse('get_recommendations')
        response = self.client.get(url, {
            'method_choice': '2',
            'brief_description': 'web app using django'
        })
        self.assertEqual(response.status_code, 200)
        self.assertIn('recommendations', response.json())
