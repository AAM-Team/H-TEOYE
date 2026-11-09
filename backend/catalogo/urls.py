from django.urls import path

from . import views

urlpatterns = [
    path("dependencias/", views.DependenciaListaCrear.as_view()),
    path("dependencias/<int:pk>/", views.DependenciaEliminar.as_view()),
    path("dependencias/<int:pk>/servicios/", views.ServicioCrear.as_view()),
    path("servicios/<int:pk>/", views.ServicioEliminar.as_view()),
]