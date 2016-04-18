var Main = React.createClass({
	getInitialState: function() {
		return {};
	},
	componentDidMount: function() {
		var that = this;
		Fetch('keys').then(function(body) {
			that.setState(body);
		});
	},
	render: function() {
		if (!this.state.Keys) {
			return null;
		}
		return <Key name="/" keys={this.state.Keys} idx={1} />;
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
		body: JSON.stringify({keys: keys}),
		headers: {
			'Accept': 'application/json',
			'Content-Type': 'application/json'
		},
	}).then(function (body) {
		for(var i = 0; i < body.Values.length; i++) {
			kvmap[keys[i]] = body.Values[i];
		}
		for(var k in fetching) {
			var cb = fetching[k];
			setTimeout(cb);
		}
	});
}

var Key = React.createClass({
	getInitialState: function() {
		return {
			expand: this.props.idx == 1
		};
	},
	expand: function() {
		var expand = !this.state.expand;
		this.setState({expand: expand});
	},
	render: function() {
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
			var vs = sorted.map(function(v) {
				var vkeys = keys[v];
				var vkk = Object.keys(vkeys);
				var vcount = vkk.length;
				if (vcount == 1) {
					return <KV key={v} name={vkk[0]} bytes={this.props.keys[vkk[0]]} />;
				} else {
					return <Key key={v} name={v} keys={keys[v] || []} idx={this.props.idx + 1}/>;
				}
			}, this);
			d = (
				<div style={{marginLeft: '20px', marginTop: '10px'}}>
					{vs}
				</div>
			);
		}
		return (
			<div style={this.props.idx == 1 ? null : {padding: '10px', border: '0px solid black'}}>
				{this.props.name}
				<span>
					&nbsp;({Object.keys(this.props.keys).length})&nbsp;
					<button onClick={this.expand} style={btnStyle}>-/+</button>
				</span>
				{d}
			</div>
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
	getInitialState: function() {
		return {};
	},
	componentDidMount: function() {
		if (this.isSystem()) {
			return;
		}
		this.show();
	},
	show: function() {
		if (!kvmap[this.props.bytes]) {
			fetchval(this.props.bytes, this.forceUpdate.bind(this));
		}
	},
	isSystem: function() {
		return this.props.name.startsWith('/System/');
	},
	render: function() {
		var system;
		if (!kvmap[this.props.bytes] && this.isSystem()) {
			system = <button onClick={this.show} style={btnStyle}>show</button>;
		}
		return (
			<div style={{padding: '1px'}}>
				{this.props.name}
				<span style={kvStyle}>{kvmap[this.props.bytes]}</span>
				{system}
			</div>
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
	return fetch('/api/' + path, params)
	.catch(function (error) {
		console.log(error);
	})
	.then(function(resp) {
		return resp.json();
	});
}

ReactDOM.render(
	<div style={{fontFamily: 'sans-serif'}}>
		<Main />
	</div>,
	document.getElementById('main')
);
