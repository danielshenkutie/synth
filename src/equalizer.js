import React, { Component } from 'react';
import music from './gen3_music.mp3';

export default class Equalizer extends Component {
	constructor(props) {
		super(props);

		this.audioContext = new window.AudioContext();
		this.gainNode = new GainNode(this.audioContext, { gain: 1 });
		this.analyser = this.audioContext.createAnalyser();

		this.lowPassFilter = new BiquadFilterNode(this.audioContext, {
			type: 'lowpass',
			frequency: 500,
			gain: 1,
		});

		this.highPassFilter = new BiquadFilterNode(this.audioContext, {
			type: 'highpass',
			frequency: 500,
			gain: 1,
		});

		this.bassEQ = new BiquadFilterNode(this.audioContext, {
			type: 'lowshelf',
			frequency: 100,
			gain: 1,
		});
		this.midEQ = new BiquadFilterNode(this.audioContext, {
			type: 'peaking',
			Q: Math.SQRT1_2,
			frequency: 1500,
			gain: 1,
		});
		this.trebleEQ = new BiquadFilterNode(this.audioContext, {
			type: 'highshelf',
			frequency: 3000,
			gain: 1,
		});
	}

	async componentDidMount() {
		this.canvas = document.getElementById('visualizer');
		this.audioElement = document.getElementById('audioPlayer');
		if (this.audioContext.state === 'suspended') {
			await this.audioContext.resume();
		}
		this.source = this.audioContext.createMediaElementSource(this.audioElement);
		this.source
			.connect(this.gainNode)
			.connect(this.bassEQ)
			.connect(this.highPassFilter)
			.connect(this.lowPassFilter)
			.connect(this.analyser)
			.connect(this.audioContext.destination);
		this.audioElement.addEventListener('play', this.drawVisualizer);
	}
	render() {
		return (
			<div
				style={{
					display: 'flex',
					justifyContent: 'center',
					alignItems: 'center',
					flex: 1,
					height: '100vh',
					background: 'black',
					color: 'white',
				}}
			>
				<canvas height={600} width={window.innerWidth} id='visualizer'></canvas>
				<audio id='audioPlayer' controls crossOrigin='anonymous'>
					<source src={music}></source>
				</audio>

				<div
					style={{
						position: 'absolute',
						top: 32,
						right: 32,
						display: 'flex',
						flexDirection: 'column',
					}}
				>
					<div class='grid'>
						<label htmlFor='volume-control'>Volume</label>
						<input
							id='volume-control'
							type='range'
							min={0}
							step={0.01}
							max={1}
							onChange={(e) => {
								this.gainNode.gain.linearRampToValueAtTime(
									parseFloat(e.target.value),
									this.audioContext.currentTime + 0.01
								);
							}}
						></input>
						<label htmlFor='base-control'>Base</label>

						<input
							id='base-control'
							type='range'
							min={-10}
							step={1}
							max={10}
							onChange={(e) => {
								const value = parseInt(e.target.value);
								this.bassEQ.gain.setTargetAtTime(
									value,
									this.audioContext.currentTime,
									0.01
								);
							}}
						></input>
						<label for='mid'>Mid</label>
						<input
							type='range'
							min='-10'
							max='10'
							id='mid'
							onChange={(e) => {
								const value = parseInt(e.target.value);
								this.midEQ.gain.setTargetAtTime(
									value,
									this.audioContext.currentTime,
									0.01
								);
							}}
						/>
						<label for='treble'>Treble</label>
						<input type='range' min='-10' max='10' value='0' id='treble' />
					</div>
					<br></br>
					<span>Low pass filter</span>

					<div className='grid'>
						<label for='low-pass-q'>Gain</label>
						<input
							id='low-pass-q'
							type='range'
							min={-10}
							max={10}
							onChange={(e) => {
								this.lowPassFilter.Q.linearRampToValueAtTime(
									e.target.value,
									this.audioContext.currentTime + 1
								);
							}}
						></input>
						<label for='low-pass-frequency'>frequency</label>
						<input
							id='low-pass-frequency'
							type='range'
							min={0}
							step={100}
							max={24000}
							onChange={(e) => {
								this.lowPassFilter.frequency.linearRampToValueAtTime(
									e.target.value,
									this.audioContext.currentTime + 0.1
								);
							}}
						></input>
					</div>

					<br></br>
					<span>high pass filter</span>

					<div className='grid'>
						<label for='high-pass-q'>Gain</label>
						<input
							id='high-pass-q'
							type='range'
							min={-10}
							max={10}
							onChange={(e) => {
								this.source.mediaElement.playbackRate = e.target.value;
								this.highPassFilter.Q.linearRampToValueAtTime(
									e.target.value,
									this.audioContext.currentTime + 1
								);
							}}
						></input>
						<label for='high-pass-frequency'>frequency</label>
						<input
							id='high-pass-frequency'
							type='range'
							min={0}
							step={100}
							max={24000}
							onChange={(e) => {
								this.highPassFilter.frequency.linearRampToValueAtTime(
									e.target.value,
									this.audioContext.currentTime + 0.1
								);
							}}
						></input>
					</div>

					<br></br>
					<span>Pitch</span>

					<div className='grid'>
						<label for='pitch'>Pitch</label>
						<input
							id='pitch'
							type='range'
							min={1}
							step={0.2}
							max={10}
							onChange={(e) => {
								this.source.mediaElement.playbackRate = e.target.value;
							}}
						></input>
					</div>
				</div>
			</div>
		);
	}

	drawVisualizer = () => {
		requestAnimationFrame(this.drawVisualizer);

		const bufferLength = this.analyser.frequencyBinCount;
		this.analyser.fftSize = 256;
		console.log(bufferLength);
		const dataArray = new Uint8Array(bufferLength);
		this.analyser.getByteFrequencyData(dataArray);
		const width = window.innerWidth;
		const height = 600;
		const barWidth = (width / bufferLength) * 1.1;

		const canvasContext = this.canvas.getContext('2d');
		canvasContext.clearRect(0, 0, width, height);

		dataArray.forEach((item, index) => {
			console.log(item);
			const y = ((item / 255) * height) / 2;
			const x = barWidth * index * 1.1;

			canvasContext.fillStyle = `rgba(100,200,200,${item / 255})`;
			canvasContext.fillRect(x, height - item, barWidth, y);
		});
	};
}
