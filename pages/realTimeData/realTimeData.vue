<template>
	<view class="container">
		<view class="data_container">
		<scroll-view scroll-y="true" >
			<view>
				<view class="data_show" v-for="(channel, index) in channelList" :key="index">
					<text style="display: inline-block; font-size: 18px; width: 220px;">{{channel.channel_name}}: </text>
					<text style="font-size: 20px;">{{channel.value}} </text>
					<text style="font-size: 18px;">{{channel.unit}} </text>				
				</view>
			</view>
		</scroll-view>	
		</view>
		<view class="read_btn">
			<button type="primary">Read</button>
		</view>
	</view>	
</template>

<script>
	export default {
		data() {
			return {
				channelList: [{
						channel_name: "Number Of Cache",
						value: 910,
						unit: ""
					},
					{
						channel_name: "Device Model",
						value: "Model",
						unit: ""
					},
					{
						channel_name: "Device SN",
						value: 1233,
						unit: ""
					},
					{
						channel_name: "Battery Voltage",
						value: 3.8,
						unit: "V"
					},
					{
						channel_name: "X-axis reading",
						value: 23.5,
						unit: "°"
					},
					{
						channel_name: "Y-axis reading",
						value: 23.5,
						unit: "°"
					},
					{
						channel_name: "Z-axis reading",
						value: 23.5,
						unit: "°"
					},
					{
						channel_name: "Onboard Temperature",
						value: 20,
						unit: "℃"
					},
					{
						channel_name: "Onboard Humidity",
						value: 20,
						unit: "%"
					},
					{
						channel_name: "Barometric Pressure",
						value: 101,
						unit: "kPa"
					},
					{
						channel_name: "Lora Network Status",
						value: "Connected",
						unit: ""
					},
					{
						channel_name: "Lora Signal Strength",
						value: -40,
						unit: "dBm"
					},
				]
			}
		},
		methods: {

		}
	}
</script>

<style>
	.container {
		padding: 16px;
		font-size: 14px;
		line-height: 24px;
	}
	.data_container {
		height: 80vh;
	}
	.data_show{
		height: 35px;
		border: 1px solid lightgrey;
		margin: 8px 0;
	}
	.read_btn {
		width: 100%;
		position: fixed;
		left: 0;
		bottom: 0;
	}
</style>