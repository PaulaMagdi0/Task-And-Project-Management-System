# Generated by Django 5.2.1 on 2025-05-12 21:55

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ("assignments", "0001_initial"),
        ("courses", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="assignment",
            name="course",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE, to="courses.course"
            ),
        ),
    ]
