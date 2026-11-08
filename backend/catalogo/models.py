from django.db import models


class Dependencia(models.Model):
    """Dependencia del Ayuntamiento (por ejemplo, Tesorería Municipal)."""

    nombre = models.CharField(max_length=120, unique=True)
    descripcion = models.CharField(max_length=300)
    creado_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["id"]
        verbose_name = "dependencia"
        verbose_name_plural = "dependencias"

    def __str__(self):
        return self.nombre


class Servicio(models.Model):
    """Servicio que una dependencia ofrece a la ciudadanía."""

    dependencia = models.ForeignKey(
        Dependencia,
        on_delete=models.CASCADE,
        related_name="servicios",
    )
    nombre = models.CharField(max_length=120)
    creado_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["id"]
        verbose_name = "servicio"
        verbose_name_plural = "servicios"
        constraints = [
            models.UniqueConstraint(
                fields=["dependencia", "nombre"],
                name="servicio_unico_por_dependencia",
            ),
        ]

    def __str__(self):
        return f"{self.nombre} ({self.dependencia.nombre})"