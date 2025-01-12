<template>
	<view class="container">
		<scroll-view scroll-y="true" class="config_container">
			<view>
				<view class="config_cell" v-for="(config, index) in configList" :key="index">
					<text class="config_label">{{config.name}}{{config.unit?`(${config.unit})`: ""}}: </text>
					<uni-easyinput type="text" v-model="config.value" :disabled="!config.editable" class="config_value"></uni-easyinput>
					<label>
						<checkbox v-if="config.name.includes('Date Time')" :checked="datetimeConfig" />
					</label>
				</view>
				<br />
			</view>
		</scroll-view>		
	</view>
	<view class="sb_btn">
		<view class="btn_group">
			<button type="primary" :disabled="btnDisabled">Read</button>
			<button type="primary" :disabled="btnDisabled">Submit</button>
		</view>		
	</view>	
</template>

<script>
	import bleInfo from "@/common/common.js"
	export default {
		data() {
			return {
				datetimeConfig: false,
				btnDisabled: !bleInfo.ble_connected,
				configList: [{
						name: "Date Time",
						value: "",
						editable: false,
						unit: ""
					},
					{
						name: "Collection Cycle",
						value: 100,
						editable: true,
						unit: "minute(s)"
					},
					{
						name: "Device SN",
						value: 100,
						editable: false,
						unit: ""
					},
					{
						name: "Frequency Band",
						value: 100,
						editable: true,
						unit: ""
					},
					{
						name: "Channel",
						value: 100,
						editable: true,
						unit: ""
					},
					{
						name: "fport",
						value: 100,
						editable: true,
						unit: ""
					},
					{
						name: "DEVEUI",
						value: "9DA7B011D40ABC8A",
						editable: true,
						unit: ""
					},
					{
						name: "APPKEY",
						value: "00112233445566778899AABBCCDDEEFF",
						editable: true,
						unit: ""
					},
					{
						name: "Channel Index",
						value: 1,
						editable: false,
						unit: ""
					},
					{
						name: "X-axis Coefficient",
						value: 100,
						editable: true,
						unit: ""
					},
					{
						name: "Y-axis coefficient",
						value: 100,
						editable: true,
						unit: ""
					},
					{
						name: "Z-axis coefficient",
						value: 100,
						editable: true,
						unit: ""
					},
				]
			}
		},
		methods: {
			getCurrentTime() {
				let date = new Date()
				let year = date.getFullYear()
				let month = (date.getMonth() + 1).toString().padStart(2, '0')
				let day = date.getDay().toString().padStart(2, '0')
				let hours = date.getHours().toString().padStart(2, '0')
				let minutes = date.getMinutes().toString().padStart(2, '0')
				let seconds = date.getSeconds().toString().padStart(2, '0')
				this.configList[0].value = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
			}
		},
		mounted() {
			this.getCurrentTime()
		}
	}
</script>

<style>
	.container {
		margin: 10px;
		font-size: 14px;
		line-height: 24px;
	}
	
	.config_container {
		height: 88vh;
	}
	
	.config_cell {
		display: flex;
		flex-direction: row;
		border: 1px solid lightgray;
		margin: 12px 0;
		vertical-align: bottom;
	}

	.config_label {
		display: flex;
		width: 150px;
		font-size: 18px;
	}

	.config_value {
		font-size: 18px;
	}
	
	.btn_group{
		display: flex;
	}
	
	.sb_btn {
		position: fixed;
		left: 0;
		bottom: 0;
		width: 100%;
	}
	
	button{
		width: 100%;
	}
</style>