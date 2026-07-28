/**
 * Utilidades de sesión en el cliente.
 *
 * La autorización real la aplica el servidor: aquí sólo se guarda el token y se
 * evita mostrar pantallas privadas a quien no ha iniciado sesión.
 */
var Auth = {
  guardarSesion: function (datos) {
    localStorage.setItem('userToken', datos.token);
    localStorage.setItem('usernameLogin', datos.usernameLogin);
    localStorage.setItem('userName', datos.name);
    localStorage.setItem('userSurname', datos.surname);
    localStorage.setItem('userMail', datos.email);
  },

  getToken: function () {
    return localStorage.getItem('userToken');
  },

  getUsername: function () {
    return localStorage.getItem('usernameLogin');
  },

  cerrarSesion: function () {
    ['userToken', 'usernameLogin', 'userName', 'userSurname', 'userMail'].forEach(function (clave) {
      localStorage.removeItem(clave);
    });
    window.location.href = '../login.html';
  },

  /** Cabeceras con el token para las llamadas autenticadas. */
  headers: function () {
    var token = Auth.getToken();
    return token ? { Authorization: 'Bearer ' + token } : {};
  },

  /**
   * Redirige al login si no hay sesión. Se llama desde las páginas de
   * /registrado, que antes eran accesibles escribiendo la URL directamente.
   */
  protegerPagina: function () {
    if (!Auth.getToken()) {
      window.location.href = '../login.html';
    }
  },
};
