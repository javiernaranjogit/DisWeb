
$( "#nuevo_registro" ).submit(function( event ) {
    event.preventDefault()
    var $inputs = $('#nuevo_registro :input');
    var data = {};
    $inputs.each(function() {
        if(this.id =="horaEntrada"){
          var valor = $(this).val() + ":00";
          data[this.id] = valor;
        }else if(this.id =="horaSalida"){
          var valor = $(this).val() + ":00";
          data[this.id] = valor;
        }else{
        data[this.id] = $(this).val();
      }
    });
        $.ajax({
          url: AppConfig.API_BASE + "/nuevoregistro/",
          type: 'post',
          data: data,
          dataType: 'JSON',
          error: function(XMLHttpRequest, textStatus, errorThrown) {
            alert('Error al crear el registro, reinténtelo más tarde');
            console.log(JSON.stringify(XMLHttpRequest));
            console.log(JSON.stringify(textStatus));
            console.log(JSON.stringify(errorThrown));
          },
          success: function (data) {
           alert('Registro creado.');
           $.mobile.changePage("index.html", "slideup");
          }
    });
  });