from rest_framework import generics, status
from rest_framework.exceptions import NotFound, ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Dependencia, Servicio
from .serializers import DependenciaSerializer, ServicioSerializer


class DependenciaListaCrear(generics.ListCreateAPIView):
    """
    GET  /api/dependencias/  -> lista de dependencias con sus servicios
    POST /api/dependencias/  -> alta de una dependencia con sus servicios
    """

    queryset = Dependencia.objects.prefetch_related("servicios")
    serializer_class = DependenciaSerializer


class DependenciaEliminar(generics.DestroyAPIView):
    """DELETE /api/dependencias/<id>/  -> elimina la dependencia y sus servicios"""

    queryset = Dependencia.objects.all()


class ServicioCrear(APIView):
    """POST /api/dependencias/<id>/servicios/  -> agrega un servicio a la dependencia"""

    def post(self, request, pk):
        dependencia = Dependencia.objects.filter(pk=pk).first()
        if dependencia is None:
            raise NotFound("La dependencia ya no existe.")
        serializer = ServicioSerializer(data=request.data, context={"dependencia": dependencia})
        serializer.is_valid(raise_exception=True)
        serializer.save(dependencia=dependencia)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class ServicioEliminar(generics.DestroyAPIView):
    """DELETE /api/servicios/<id>/  -> elimina un servicio (nunca el último)"""

    queryset = Servicio.objects.all()

    def perform_destroy(self, servicio):
        if servicio.dependencia.servicios.count() <= 1:
            raise ValidationError(
                {"detail": "Una dependencia debe tener al menos un servicio."}
            )
        servicio.delete()