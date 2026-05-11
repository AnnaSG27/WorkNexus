from django.db.models import Avg, Count

from .models import Review


def get_freelancer_review_stats(freelancer_profile):
    stats = Review.objects.filter(freelancer=freelancer_profile).aggregate(
        average_rating=Avg("rating"),
        reviews_count=Count("id"),
    )
    average_rating = stats["average_rating"] or 0
    return {
        "averageRating": round(float(average_rating), 1) if average_rating else 0.0,
        "reviewsCount": stats["reviews_count"] or 0,
    }
