from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path


def health_check(request):
    """Endpoint de health check para Render"""
    return JsonResponse({"status": "ok", "service": "H-TEOYE Backend"})


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("catalogo.urls")),
    path("api/health/", health_check, name="health_check"),
]