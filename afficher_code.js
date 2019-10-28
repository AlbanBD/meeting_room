var socket = io.connect('http://localhost:8080');
socket.on('res', function(code) {
	document.getElementById("code_reunion").innertHTML = code;
}
