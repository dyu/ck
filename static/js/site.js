(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var Main = React.createClass({
	displayName: 'Main',

	getInitialState: function () {
		return {};
	},
	componentDidMount: function () {
		var that = this;
		Fetch('keys').then(function (body) {
			that.setState(body);
		});
	},
	render: function () {
		if (!this.state.Keys) {
			return null;
		}
		return React.createElement(Key, { name: '/', keys: this.state.Keys, idx: 1 });
	}
});

var kvmap = {};
var tofetch = {};

function fetchval(key, cb) {
	tofetch[key] = cb;
	setTimeout(doFetch);
}

function doFetch() {
	var fetching = tofetch;
	var keys = Object.keys(fetching);
	if (keys.length == 0) {
		return;
	}
	tofetch = {};
	Fetch('values', {
		method: 'post',
		body: JSON.stringify({ keys: keys }),
		headers: {
			'Accept': 'application/json',
			'Content-Type': 'application/json'
		}
	}).then(function (body) {
		for (var i = 0; i < body.Values.length; i++) {
			kvmap[keys[i]] = body.Values[i];
		}
		for (var k in fetching) {
			var cb = fetching[k];
			setTimeout(cb);
		}
	});
}

var Key = React.createClass({
	displayName: 'Key',

	getInitialState: function () {
		return {
			expand: this.props.idx == 1
		};
	},
	expand: function () {
		var expand = !this.state.expand;
		this.setState({ expand: expand });
	},
	render: function () {
		var d;
		var btn;
		if (this.state.expand) {
			var keys = {};
			for (var k in this.props.keys) {
				var p = part(k, this.props.idx);
				if (!keys[p]) {
					keys[p] = {};
				}
				keys[p][k] = this.props.keys[k];
			}
			var sorted = Object.keys(keys).sort();
			var vs = sorted.map(function (v) {
				var vkeys = keys[v];
				var vkk = Object.keys(vkeys);
				var vcount = vkk.length;
				if (vcount == 1) {
					return React.createElement(KV, { key: v, name: vkk[0], bytes: this.props.keys[vkk[0]] });
				} else {
					return React.createElement(Key, { key: v, name: v, keys: keys[v] || [], idx: this.props.idx + 1 });
				}
			}, this);
			d = React.createElement(
				'div',
				{ style: { marginLeft: '20px', marginTop: '10px' } },
				vs
			);
		}
		return React.createElement(
			'div',
			{ style: this.props.idx == 1 ? null : { padding: '10px', border: '0px solid black' } },
			this.props.name,
			React.createElement(
				'span',
				null,
				' (',
				Object.keys(this.props.keys).length,
				') ',
				React.createElement(
					'button',
					{ onClick: this.expand, style: btnStyle },
					'-/+'
				)
			),
			d
		);
	}
});

var kvStyle = {
	marginLeft: '20px',
	padding: '1px',
	backgroundColor: '#f0f0f0',
	display: 'inline-block'
};

var KV = React.createClass({
	displayName: 'KV',

	getInitialState: function () {
		return {};
	},
	componentDidMount: function () {
		if (this.isSystem()) {
			return;
		}
		this.show();
	},
	show: function () {
		if (!kvmap[this.props.bytes]) {
			fetchval(this.props.bytes, this.forceUpdate.bind(this));
		}
	},
	isSystem: function () {
		return this.props.name.startsWith('/System/');
	},
	render: function () {
		var system;
		if (!kvmap[this.props.bytes] && this.isSystem()) {
			system = React.createElement(
				'button',
				{ onClick: this.show, style: btnStyle },
				'show'
			);
		}
		return React.createElement(
			'div',
			{ style: { padding: '1px' } },
			this.props.name,
			React.createElement(
				'span',
				{ style: kvStyle },
				kvmap[this.props.bytes]
			),
			system
		);
	}
});

var btnStyle = {
	padding: '8px'
};

function part(key, ct) {
	var idx = 0;
	for (; ct; ct--) {
		idx = key.indexOf('/', idx + 1);
		if (idx < 0 && ct == 1) {
			return key;
		}
		if (idx < 0) {
			return null;
		}
	}
	return key.substring(0, idx + 1);
}

function Fetch(path, params) {
	return fetch('/api/' + path, params).catch(function (error) {
		console.log(error);
	}).then(function (resp) {
		return resp.json();
	});
}

ReactDOM.render(React.createElement(
	'div',
	{ style: { fontFamily: 'sans-serif' } },
	React.createElement(Main, null)
), document.getElementById('main'));

},{}]},{},[1]);
