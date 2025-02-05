<template>
	<view class="container">
		<text style="font-size: 20px;">Capacity Usage:</text>
		<progress active="true" :percent="percent" show-info border-radius="3" stroke-width="20" />
		<view class="" style="margin-top: 5px;">
			<text style="color: black; font-size: 18px;">{{current}}</text>
			<text style="font-size: 18px;"> / </text>
			<text style="color: gray; font-size: 18px;">{{total}}</text>
		</view>
		<view class="" style="margin-top: 20px;">
			<text style="font-size: 20px;">Download Path: </text>
			<button type="default" @click="getHistory">test</button>
			<input type="text" :value="path" style="height: 30px; border: 1px solid grey; background: lightgray; " disabled />
		</view>
		<view class="dw_btn">
			<button type="primary" :disabled="btnDisabled" @click="download">Download</button>
		</view>
	</view>
</template>

<script>
	import bleInfo from "@/common/common.js"
	import {
		crcCheck,
		getModbusCmdBuf,
	} from "@/common/modbusRtu"
	import {
		byteStr2Int
	} from "@/common/utils.js"
	export default {
		data() {
			return {
				path: 'Documents/LoraWAN',
				total: 90000,
				current: 0,
				csvData: ["Model"],
			}
		},
		computed: {
			percent() {
				return (this.current / this.total * 100).toFixed(0)
			},
			btnDisabled() {
				return !bleInfo.ble_connected;
			}
		},
		methods: {
			onShow() {
				console.log(plus.runtime.arguments);
			},
			getCurrent(){
				bleInfo.ble_recv_data = "";
				this.current = 0;
				let cmdStr = "01 03 00 00 00 00 01";
				let modbusCmd = getModbusCmdBuf(cmdStr);
				uni.writeBLECharacteristicValue({
					deviceId: bleInfo.ble_device.deviceId,
					serviceId: bleInfo.ble_service.uuid,
					characteristicId: bleInfo.ble_send_characteristic.uuid,
					value: modbusCmd,
					success: (res) => {
						uni.$once("dataArrive", () => {
							if (crcCheck(bleInfo.ble_recv_data)) {
								let data = bleInfo.ble_recv_data.slice(6, bleInfo.ble_recv_data.length - 4).match(/.{1,8}/g);
								this.current = byteStr2Int(data[0]);
								console.log(this.current);
								bleInfo.ble_recv_data = "";
								setTimeout(() => {
									uni.$emit("currentReady");
								}, 600);
							}
						});
					},
					fail: (res) => {
						console.log("读取缓存数量失败");
					}
				});
			},
			getHistoryOnce() {
				uni.$once("currentReady", () => {
					if (bleInfo.ble_device.name.includes("DWL4")) {
						/*for (let index = 0; index < this.current; index++) {
							cmdStr = `01 03 ${(0x000200+index).toString(16).padStart(6,'0')} 00 01`;
							console.log(`+++++${index}+++++`, cmdStr);*/
							console.log("readDWL4");
							let cmdStr = "01 03 00 02 00 00 01"
							let modbusCmd = getModbusCmdBuf(cmdStr);
							uni.writeBLECharacteristicValue({
								deviceId: bleInfo.ble_device.deviceId,
								serviceId: bleInfo.ble_service.uuid,
								characteristicId: bleInfo.ble_send_characteristic.uuid,
								value: modbusCmd,
								success: (res) => {
									console.log("success 1");
									uni.$once("dataArrive", () => {
										console.log("success 2");
										if (crcCheck(bleInfo.ble_recv_data)) {
											console.log("success 3");
											let data = bleInfo.ble_recv_data.slice(8, bleInfo.ble_recv_data.length - 6);
											console.log('********', data);
											let datetime = data.slice(0, 12).match(/.{1,6}/g);
											let collectionData = data.slice(12, ).match(/.{1,8}/g);
											console.log('------', datetime, collectionData);
										}
									});
								},
								fail: (res) => {
									console.log(`读取缓存失败，地址:${(0x000200+index).toString(16).padStart(6,'0')}`);
								}
							});
						// }
					} else if (bleInfo.ble_device.name.includes("TILT")) {
						let cmdStr = "01 03 00 00 00 00 15";
						let modbusCmd = getModbusCmdBuf(cmdStr);
					}
				});
			},
			download() {
				const richAlert = uni.requireNativePlugin("DCloud-FilePicker");
				console.log(richAlert);
				richAlert.saveFile({
					folder: this.path,
					fileName: "111.csv",
					data: "1,1,232,323,32"
				}, result => {
					console.log("======", result);
				});
			},

		},
		onShow() {
			if(bleInfo.ble_connected){
				this.getCurrent();
			}
		}
	}
</script>

<style>
	.container {
		margin: 10px;
		font-size: 14px;
		line-height: 24px;
	}

	.dw_btn {
		position: fixed;
		bottom: 0;
		left: 0;
		width: 100%;
	}
</style>