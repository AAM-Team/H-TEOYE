import unicodedata

from django.db import transaction
from rest_framework import serializers

from .models import Dependencia, Servicio


def limpiar(texto):
    """Quita espacios al inicio, al final y repetidos."""
    return " ".join((texto or "").split())


def normalizar(texto):
    """Compara textos ignorando mayúsculas, acentos y espacios extra."""
    sin_acentos = unicodedata.normalize("NFD", limpiar(texto))
    sin_acentos = "".join(c for c in sin_acentos if unicodedata.category(c) != "Mn")
    return sin_acentos.lower()


class ServicioSerializer(serializers.ModelSerializer):
    nombre = serializers.CharField(
        max_length=120,
        error_messages={
            "required": "El nombre del servicio es obligatorio.",
            "blank": "El nombre del servicio es obligatorio.",
            "max_length": "El nombre del servicio no puede pasar de 120 caracteres.",
        },
    )

    class Meta:
        model = Servicio
        fields = ["id", "nombre", "creado_en"]

    def validate_nombre(self, valor):
        valor = limpiar(valor)
        if not valor:
            raise serializers.ValidationError("El nombre del servicio es obligatorio.")

        # Al agregar un servicio, la vista manda la dependencia en el contexto.
        dependencia = self.context.get("dependencia")
        if dependencia is not None:
            existentes = dependencia.servicios.values_list("nombre", flat=True)
            if any(normalizar(n) == normalizar(valor) for n in existentes):
                raise serializers.ValidationError(
                    f'El servicio "{valor}" ya existe en esta dependencia.'
                )
        return valor


class DependenciaSerializer(serializers.ModelSerializer):
    nombre = serializers.CharField(
        max_length=120,
        error_messages={
            "required": "El nombre de la dependencia es obligatorio.",
            "blank": "El nombre de la dependencia es obligatorio.",
            "max_length": "El nombre de la dependencia no puede pasar de 120 caracteres.",
        },
    )
    descripcion = serializers.CharField(
        max_length=300,
        error_messages={
            "required": "La descripción es obligatoria.",
            "blank": "La descripción es obligatoria.",
            "max_length": "La descripción no puede pasar de 300 caracteres.",
        },
    )
    # Al crear se reciben los nombres de los servicios como lista de textos.
    # Al consultar se devuelven completos (ver to_representation).
    servicios = serializers.ListField(
        child=serializers.CharField(max_length=120, allow_blank=True),
        write_only=True,
        error_messages={"required": "Asigna al menos un servicio a la dependencia."},
    )

    class Meta:
        model = Dependencia
        fields = ["id", "nombre", "descripcion", "creado_en", "servicios"]

    def validate_nombre(self, valor):
        valor = limpiar(valor)
        if not valor:
            raise serializers.ValidationError("El nombre de la dependencia es obligatorio.")
        existentes = Dependencia.objects.values_list("nombre", flat=True)
        if any(normalizar(n) == normalizar(valor) for n in existentes):
            raise serializers.ValidationError(f'Ya existe una dependencia llamada "{valor}".')
        return valor

    def validate_descripcion(self, valor):
        valor = limpiar(valor)
        if not valor:
            raise serializers.ValidationError("La descripción es obligatoria.")
        return valor

    def validate_servicios(self, valores):
        nombres = [limpiar(v) for v in valores if limpiar(v)]
        if not nombres:
            raise serializers.ValidationError("Asigna al menos un servicio a la dependencia.")
        vistos = set()
        for nombre in nombres:
            clave = normalizar(nombre)
            if clave in vistos:
                raise serializers.ValidationError(f'El servicio "{nombre}" está repetido.')
            vistos.add(clave)
        return nombres

    @transaction.atomic
    def create(self, datos):
        nombres_servicios = datos.pop("servicios")
        dependencia = Dependencia.objects.create(**datos)
        Servicio.objects.bulk_create(
            [Servicio(dependencia=dependencia, nombre=n) for n in nombres_servicios]
        )
        return dependencia

    def to_representation(self, instancia):
        datos = super().to_representation(instancia)
        datos["servicios"] = ServicioSerializer(instancia.servicios.all(), many=True).data
        return datos