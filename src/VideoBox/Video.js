import React from 'react';

class Video extends React.Component {
	video = null;
	container = null; 

	componentDidMount() {
		this.video.srcObject = this.props.stream;
		this.video.play();
	}

	componentWillReceiveProps(nextProps) {
		if (nextProps.stream!==this.props.stream) {
			this.video.srcObject = nextProps.stream;
			this.video.play();
		}
	}

	render () {
		const {
			id,
			muted,
			style
		} = this.props;

		return <video
			id={`video-${id}`}
			muted={muted}
			style={style}
			ref={(video) => { 
				this.video = video; 
			}}
		/>
	}
}

export default Video;