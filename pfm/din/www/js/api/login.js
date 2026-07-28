$("#login").submit(function (event) {
  event.preventDefault();
  var $inputs = $("#login :input");
  var data = {};
  $inputs.each(function () {
    data[this.id] = $(this).val();
  });

  $.ajax({
    url: AppConfig.API_BASE + "/login",
    type: "post",
    timeout: 5000,
    data: {
      username: data.user,
      password: data.pass,
    },
    dataType: "json",
    // El servidor responde 401 con un mensaje genérico: no distingue entre
    // usuario inexistente y contraseña incorrecta.
    error: function (xhr) {
      if (xhr.status === 401) {
        alert("Usuario o contraseña incorrectos");
      } else {
        alert("No se pudo conectar con el servidor, inténtelo más tarde");
      }
    },
    success: function (respuesta) {
      Auth.guardarSesion(respuesta);
      window.location.href = "registrado/dashboard.html";
    },
  });
});
