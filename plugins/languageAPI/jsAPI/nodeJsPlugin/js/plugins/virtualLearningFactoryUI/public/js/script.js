var apiEndPoint = 'http://localhost:3000/api/v1/';
var userNodeName;
var userNodePostion;
var otherUserNodeNames = [];
var otherUserNodePositions = [];

function getNodesNames() {
	console.log('getNodesNames()');
	doGetRequest(apiEndPoint + 'nodeNames/', function (res) {
		var nodeNames = res.data.items;
		console.log('getNodesNames(): res: ', nodeNames);

		nodeNames.forEach(function (element) {
			genNodeItem(element.name);
		});
	});
}

function getUserNodeName() {
	console.log('getUserNodeName()');
	doGetRequest(apiEndPoint + 'userNodeName/', function (res) {
		userNodeName = res.data.items[0].name;
		console.log('userNodeName(): res: ', userNodeName);
	});
}

function getUserNodePosition() {
	console.log('getUserNodePosition()');
	doGetRequest(apiEndPoint + "/nodes/" + userNodeName + '/position', function (res) {
		userNodePostion = res.data.items[0].position;
		console.log('getUserNodePosition(): res: ', userNodePostion);
	});
}

function getOtherUserNodeNames() {
	console.log('getOtherUserNodeNames()');
	doGetRequest(apiEndPoint + 'otherUserNodeNames/', function (res) {
		otherUserNodeNames = res.data.items;
	});
}

function getOtherUserNodePositions() {
	console.log('getOtherUserNodePositions()');
	otherUserNodeNames.forEach(function (element) {
		doGetRequest(apiEndPoint + "/nodes/" + element.name + '/position', function (res) {
			console.log('getOtherUserNodePositions(): res: ', res.data.items[0].position);
			otherUserNodePositions.push(res.data.items[0].position);
		});
	});
}

function attach2UserNode(parentNodeName) {
	console.log('attach2UserNode: ', parentNodeName);
	doGetRequest(apiEndPoint + "/nodes/" + userNodeName + "/" + parentNodeName + '/parent', function (res) {
		var parentNodeName = res.data.items[0].parentName;
		console.log('parentNodeName(): res: ', parentNodeName);
	});
}

function setNodePosition(nodeName, pos) {
	console.log('setNodePosition(): ', nodeName, ' pos: ', pos);
	doPostRequest(apiEndPoint + "/nodes/" + nodeName + '/position', pos, function (res) {
		console.log('setNodePosition(): res: ', res);
	});
}

function setNodeOrientation(nodeName, ori) {
	console.log('setNodeOrientation(): ', nodeName, ' ori: ', ori);
	doPostRequest(apiEndPoint + "/nodes/" + nodeName + '/orientation', ori, function (res) {
		console.log('setNodeOrientation(): res: ', res);
	});
}

function doGetRequest(apiEndPointUrl, callback) {
	console.log('doGetRequest()');
    $.get(apiEndPointUrl, function(res) {
        console.log('doGetRequest(): res: ', res);
        callback(res);
    });
}

function doPostRequest(apiEndPointUrl, data, callback) {
    $.post(apiEndPointUrl, data, function(res) {
        // console.log('doPostRequest(): ', res);
        callback(res);
    }, "json");
}

function showChat() {
    console.log('toogle chat');
	$('#chat').toggle();
}

function showUsers() {
	console.log('toogle users');
	$('#users').toggle();
	getUserNodeName();
	getOtherUserNodeNames();
	var usersDiv = document.getElementById('users');
	otherUserNodeNames.forEach(function (element) {
		var otherUserNodeNameDiv = document.getElementById(element.name);
		if (typeof (otherUserNodeNameDiv) != 'undefined' && otherUserNodeNameDiv != null) {
			otherUserNodeNameDiv.innerHTML = element.name;
		}
		else {
			var newDiv = document.createElement('div');
			newDiv.id = element.name;
			newDiv.innerHTML = element.name;
			newDiv.addEventListener('click', function () {
				var pos = {x: 0, y: 0, z: 0};
				setNodePosition(userNodeName, pos);
				var ori = {w: 1, x: 0, y: 0, z: 0};
				setNodeOrientation(userNodeName, ori);
				attach2UserNode(element.name);
			});
			usersDiv.appendChild(newDiv);
		}
	});
}

function updateMap() {
	console.log('update map');
	getUserNodeName();
	getOtherUserNodeNames();
	getUserNodePosition();
	getOtherUserNodePositions();

	var canvas = document.getElementById("mapCanvas");
	var ctx = canvas.getContext("2d");
	ctx.clearRect(0, 0, canvas.width, canvas.height);

	var mapDiv = document.getElementById('map');
	
	let index = 0;
	otherUserNodeNames.forEach(function (element) {
		var scale = 0.1;
		var pos = otherUserNodePositions.pop();
		var relativePosition = { x: (userNodePostion.x - pos.x) * scale, y: (userNodePostion.y - pos.y) * scale, z: (userNodePostion.z - pos.z) * scale };
		console.log('relativePosition: ', relativePosition)
		ctx.beginPath();
		ctx.arc((canvas.width / 2) - relativePosition.x, (canvas.height / 2) - relativePosition.y, 5, 0, 2 * Math.PI);
		ctx.stroke();
		index++;
	});
}

function showMap() {
    console.log('toogle map');
    $('#map').toggle();
}

$(document).ready(function () {
	getUserNodeName();
	getOtherUserNodeNames();
	getUserNodePosition();
	getOtherUserNodePositions();
	$('#map').toggle();
	$('#users').toggle();
    var sock = new WebSocket("ws://localhost:40080/ws");
    sock.onopen = ()=>{
    	console.log('open')
    	window.setInterval(function () {
    		updateMap();
    	}, 500);
    }
    sock.onerror = (e)=>{
        console.log('error',e)
    }
    sock.onclose = ()=>{
        console.log('close')
    }
    sock.onmessage = (e)=>{
        console.log('onmessage:' + e.data);
        var eventObj = JSON.parse(e.data);
        console.log('eventObj: ', eventObj);
		
		if (eventObj.type == 9) { 
			$("#nodeName").val(eventObj.subjectName);
            nodeName = eventObj.subjectName;
			console.log(' show bounding box - select: ', nodeName);
			document.getElementById('selectedNodeNameTitle').innerHTML = nodeName;
        }
    }
});
