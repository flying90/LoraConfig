<template>
	<view class="container">
		<text style="font-size: 18px;">Search Results:</text>
		<scroll-view scroll-y="true" class="scroll_y">
			<view class="dev_option" v-for="(device, index) in bluetoothList" :key="index">
				<view class="dev">
					<image class="dev_ico" src="/static/image/device.png" mode="aspectFit"></image>
				</view>
				<view class="dev dev_info">
					<view>Device Name: {{device.name || device.localName}}</view>
					<!-- <view>Signal Quality: {{device.RSSI}} dBm</view> -->
					<view>MAC: {{device.uuid}}</view>
				</view>
				<view class="dev">
					<text>{{device.RSSI}} dBm</text>
					<!-- <image class="signal_icon" v-if="device.RSSI >= -50" :src="'/static/image/Wi-fi-2.png'" alt=""></image>
					<image class="signal_icon" v-else-if="device.RSSI >= -70" :src="'/static/image/Wi-fi-1.png'" alt=""></image>
					<image class="signal_icon" v-else :src="'/static/image/Wi-fi.png'" alt=""></image> -->
					<!-- <button size="mini" :disabled="connectBtnStatus" @click="handleConnect(device)">Conn</button> -->
				</view>
			</view>
		</scroll-view>
		<view class="srh_btn">
			<button type="primary">Start Scan</button>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				connectBtnStatus: false,
				bluetooth: {
					name: "",
					RSSI: "",
					uuid: ""
				},
				bluetoothList: [],
			}
		},
		computed: {
			
		},
		methods: {
			handleConnect() {
				console.log("handle connection.")
			}
		},
		mounted() {
			for (var index = 0; index < 10; index++) {
				this.bluetoothList.push({
					name: `device${index}`,
					RSSI: (Math.random()*80*-1).toFixed(0),
					uuid: "11:22:33:44:55:66"
				})
			}
		}
	}
</script>

<style>
	.container {
		padding: 20px;
		font-size: 14px;
		line-height: 24px;
	}

	.scroll_y {
		height: 84vh;
	}

	.dev_option {
		background: #F5F6F7;
		margin: 12px 0px;
		border-radius: 12px;
	}

	.dev {
		display: inline-block;
		padding-bottom: 14px;
	}

	.dev_ico {
		width: 38px;
		height: 38px;
	}

	.dev.dev_info {
		width: 60vw;
		padding-top: 10px;
	}
	
	.signal_icon {
		width: 40px;
		height: 40px;
	}
	
	.srh_btn {
		position: fixed;
		left: 0;
		bottom: 0;
		width: 100%;
	}
</style>