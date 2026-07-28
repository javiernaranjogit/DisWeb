$("#nueva_divisa_cartera").ready(function( event ) {
  var nombre_usuario = window.localStorage.getItem('userName');
  document.getElementById("nombre_usuario").innerHTML = "<b>" + nombre_usuario + "</b>";
});

$( "#nuevo_registro" ).submit(function( event ) {
  event.preventDefault()
  var $inputs = $('#nuevo_registro :input');
  var data = {};
  $inputs.each(function() {
      data[this.id] = $(this).val();
    });
  var data_send = { rates: data.origen + ":" + data.cantidad };
      $.ajax({
        url: AppConfig.API_BASE + "/addToCartera",
        type: 'post',
        headers: Auth.headers(),
        data: data_send,
        dataType: 'JSON',
        error: function(XMLHttpRequest, textStatus, errorThrown) {
          alert('Error al crear el registro, reinténtelo más tarde');
          console.log(JSON.stringify(XMLHttpRequest));
          console.log(JSON.stringify(textStatus));
          console.log(JSON.stringify(errorThrown));
        },
        success: function (data) {
         alert('Nueva moneda añadida creado');
         location.href="cartera.html";
        }
  });
});