<template>
	<div class="reader">
		<h1 v-if="readerName">Reader: {{ readerName }}</h1>

		<p v-if="!uid && readerName">{{ UIDMsg }}<p>
		<p v-if="!readerName">{{ readerMsg }}<p>

		<h2 v-if="uid">UID: {{ uid }}</h2>
	</div>
</template>

<script>

	import { NFC } from 'nfc-pcsc';

	export default {

		data() {
			return {
				nfc: null,
				readers: null,
				readerName: null,
				UIDMsg: 'Plaats een keycard op de reader.',
				readerMsg: 'Sluit een RFID reader aan via een van de USB poorten',
				uid: null
			};
		},

		created() {
			console.log('created', this);
		},

		mounted() {
			console.log('mounted', this);

			this.nfc = new NFC();
			this.readers = new Set();
			// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set

			this.nfc.on('reader', reader => {

				console.log(`${reader.name} reader attached, waiting for cards ...`);
				this.readers.add(reader);
				this.readerName = reader.name;

				reader.on('card', card => {
					console.log(`card ${card.uid}`);
					this.uid = card.uid;
				});

				reader.on('card.off', card => {
					console.log(`${reader.reader.name}  card removed`, card);
					this.uid = null;
				});

				reader.on('error', err => {
					console.error(`reader error`, err);
				});

				reader.on('end', () => {
					console.log(`${reader.name} reader disconnected.`);
					this.readerName = null;
				});

			});

			this.nfc.on('error', err => {
				console.error(err);
			});

		},

		updated() {
			console.log('updated', this);
		},

		destroyed() {

			// stops listening for new readers
			this.nfc.close();

			this.readers.forEach(reader => {
				// stops listening for reader status changes, reader emits 'end' event
				reader.close();
			});

		},

	};

</script>

<style scoped>

	h1 {
		color: #42b983;
	}

</style>
