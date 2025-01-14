<template>
	<view class="container">
		<scroll-view scroll-y="true" class="config_container">
			<view>
				<view class="config_cell" v-for="(config, index) in commonConfigure" :key="index">
					<text class="config_label">{{config.name}}{{config.unit?`\n(${config.unit})`: ""}}: </text>
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
			<button type="primary" :disabled="btnDisabled" @click="readConfigure">Read</button>
			<button type="primary" :disabled="btnDisabled" @click="commitConfigure">Submit</button>
		</view>
	</view>
</template>

<script>
	import bleInfo from "@/common/common"
	import {
		getModbusCmdBuf,
		crcCheck
	} from "@/common/modbusRtu";
	export default {
		data() {
			return {
				datetimeConfig: false,
				commonConfigure: [{
						name: "Collection Cycle",
						value: 1,
						editable: true,
						unit: "min[1-1440]"
					},
					{
						name: "Date Time",
						value: "",
						editable: false,
						unit: ""
					},
					{
						name: "Device SN",
						value: 1,
						editable: true,
						unit: ""
					},
					{
						name: "Frequency Band",
						value: [1, 2, 3, 4, 5],
						editable: false,
						unit: ""
					},
					{
						name: "Channel",
						value: "",
						editable: true,
						unit: ""
					},
					{
						name: "fport",
						value: 1,
						editable: true,
						unit: ""
					},
					{
						name: "DEVEUI",
						value: "",
						editable: true,
						unit: ""
					},
					{
						name: "APPKEY",
						value: "",
						editable: true,
						unit: ""
					}
				],
				dwl4Configure: [{
						name: "Channel Index",
						value: [1, 2, 3, 4],
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
		computed: {
			btnDisabled() {
				return !bleInfo.ble_connected;
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
				this.commonConfigure[0].value = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
			},
			readCommonConfigure() {
				bleInfo.ble_recv_data = "";
				let cmdStr = "01 03 00 01 00 00 12";
				let modbusCmd = getModbusCmdBuf(cmdStr);
				uni.writeBLECharacteristicValue({
					deviceId: bleInfo.ble_device.deviceId,
					serviceId: bleInfo.ble_service.uuid,
					characteristicId: bleInfo.ble_send_characteristic.uuid,
					value: modbusCmd,
					success: (res) => {
						console.log("读取数据成功: " + res.errMsg);
						setTimeout(() => {
							if (bleInfo.ble_recv_data) {
								console.log("ble info " + bleInfo.ble_recv_data);
								if (crcCheck(bleInfo.ble_recv_data)) {
									let data = bleInfo.ble_recv_data.slice(6, bleInfo.ble_recv_data.length - 4).match(/.{1,8}/g);
									console.log(data);
									
									uni.showToast({
										title: "success."
									});
								} else {
									bleInfo.ble_recv_data = '';
								}
							}
						}, 3000);

					},
					fail: (err) => {
						console.error("读取设置失败: " + err.errMsg);
					}
				})
			},
			readSpecialConfigure(channelIndex){
				bleInfo.ble_recv_data = "";
				let cmdStr = `01 03 00 01 32 00 ${channelIndex.toString(16).toUpperCase()}`
				console.log(cmdStr);
				
			},
			commitConfigure() {
				bleInfo.ble_recv_data = ""
				let cmdStr = "01 03 00 01 32 00 01";
				// let cmdStr = "01 15 00 01 32 00 05 00000001 00001771 00000192 00000003 00000f78";
				let modbusCmd = getModbusCmdBuf(cmdStr);
				uni.writeBLECharacteristicValue({
					deviceId: bleInfo.ble_device.deviceId,
					serviceId: bleInfo.ble_service.uuid,
					characteristicId: bleInfo.ble_send_characteristic.uuid,
					value: modbusCmd,
					success: (res) => {
						console.log("读取数据成功: " + res.errMsg);
						setTimeout(() => {
							if (bleInfo.ble_recv_data) {
								console.log("ble info " + bleInfo.ble_recv_data);
								if (crcCheck(bleInfo.ble_recv_data)) {
									// 0103 48 0000001e 00250113 00173754 0003a982 00000001 00000000 00000000 0000005d 00000000 00000000 00000000 
									// 00000032 00000000 00000000 5572404c 696e6b4c 6f526132 30313823 TILT5e
									let data = bleInfo.ble_recv_data.slice(6, bleInfo.ble_recv_data.length - 4).match(/.{1,8}/g);
									console.log(data);
									// if (bleInfo.ble_device.name.includes("DWL4")) {
									// 	for (let i = 0; i < data.length; i++) {
									// 		if (i < 4) {
									// 			if (i === 3) {
									// 				this.commonChannels[i].value = byteStr2Int(data[i]) / 100;
									// 			} else {
									// 				this.commonChannels[i].value = byteStr2Int(data[i]);
									// 			}
									// 		} else if (i < 12) {
									// 			this.dwl4Channels[i - 4].value = byteStr2Float(data[i]).toFixed(1);
									// 		} else if (i < 14) {
									// 			this.commonChannels[i - 8].value = byteStr2Float(data[i]).toFixed(1);
									// 		} else if (i > 18) {
									// 			if (i === 19) {
									// 				this.commonChannels[i - 12].value = (byteStr2Float(data[i]).toFixed(0) == 1) ? "Joined" : "Not Joined";
									// 			} else {
									// 				this.commonChannels[i - 12].value = byteStr2Float(data[i]).toFixed(1);
									// 			}
									// 		}
									// 	}
									// } else if (bleInfo.ble_device.name.includes("TILT")) {

									// }
									uni.showToast({
										title: "success."
									});
								} else {
									bleInfo.ble_recv_data = '';
								}
							}
						}, 3000);

					},
					fail: (err) => {
						console.error("读取设置失败: " + err.errMsg);
					}
				})
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
		align-items: center;
	}

	.config_label {
		display: flex;
		width: 150px;
		font-size: 18px;
	}

	.config_value {
		font-size: 18px;
	}

	.btn_group {
		display: flex;
	}

	.sb_btn {
		position: fixed;
		left: 0;
		bottom: 0;
		width: 100%;
	}

	button {
		width: 100%;
	}
</style>