from django.contrib import admin
from .models import Dependencia, Servicio


@admin.register(Dependencia)
class DependenciaAdmin(admin.ModelAdmin):
    list_display = ("id", "nombre", "creado_en")
    search_fields = ("nombre", "descripcion")


@admin.register(Servicio)
class ServicioAdmin(admin.ModelAdmin):
    list_display = ("id", "nombre", "dependencia", "creado_en")
    search_fields = ("nombre", "dependencia__nombre")
    list_filter = ("dependencia",)
