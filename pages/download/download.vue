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
			<input type="text" :value="path" style="height: 30px; border: 1px solid grey; background: lightgray; " disabled />
		</view>
		<view class="dw_btn">
			<button type="primary" :disabled="btnDisabled" @click="getData">Download</button>
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
		byteStr2Float,
		byteStr2Int
	} from "@/common/utils.js"
	export default {
		data() {
			return {
				path: 'Documents/LoraWAN',
				total: 90000,
				current: 0,
				batt: 0,
				interval: 0,
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
			getDatetime() {
				let date = new Date();
				let year = date.getFullYear();
				let month = (date.getMonth() + 1).toString().padStart(2, '0');
				let day = date.getDate().toString().padStart(2, '0');
				let hours = date.getHours().toString().padStart(2, '0');
				let minutes = date.getMinutes().toString().padStart(2, '0');
				let seconds = date.getSeconds().toString().padStart(2, '0');
				return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
			},
			getInfo() {
				bleInfo.ble_recv_data = "";
				this.current = 0;
				let cmdStr = "01 03 00 00 00 00 10";
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
								this.batt = byteStr2Int(data[3]) / 100;
								this.interval = byteStr2Float(data[15]);
								console.log(this.current, this.batt, this.interval);
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
			writeBLECharacteristicValueAsync({
				deviceId,
				serviceId,
				characteristicId,
				value
			}) {
				return new Promise((resolve, reject) => {
					uni.writeBLECharacteristicValue({
						deviceId,
						serviceId,
						characteristicId,
						value,
						success: (res) => {
							uni.$once("dataArrive", () => {
								if (crcCheck(bleInfo.ble_recv_data) && bleInfo.ble_recv_data.length > 20) {
									let data = bleInfo.ble_recv_data.slice(8, bleInfo.ble_recv_data.length - 6);
									resolve(data); // 成功时返回结果
								} else {
									reject(res);
								}
							});

						},
						fail: (err) => {
							reject(err); // 失败时抛出错误
						},
					});
					setTimeout(() => {
						reject("timeout")
					}, 8000);
				});
			},
			async getData() {
				try {
					const richAlert = uni.requireNativePlugin("DCloud-FilePicker");
					this.getInfo();
					uni.$once("currentReady", async () => {
						if (bleInfo.ble_device.name.includes("DWL4")) {
							bleInfo.isCsvLoading = true;
							uni.showLoading({
								title: "Downloading...",
								mask: true
							});
							let csvData =
								`Model,DWL-TILT-CDSK,
SN,${bleInfo.ble_device.name.slice(5,)},,AppVersion,V1.0.0,
Logging Interval,${this.interval}min,
Download Time,${this.getDatetime()},
Battery Voltage(V),${this.batt},
Number Of Records,${this.current},
Date/Time,RECORD,Battery Voltage(V),Reading(R1),Reading(R2),Reading(R3),Reading(R4),Reading(R5),Reading(R6),Reading(R7),Reading(R8),Reading(R9),Reading(R10),Reading(R11),
,,V,Hz,Deg C,Hz,Deg C,Hz,Deg C,Hz,Deg C,Deg C,%RH,hPa`;
							for (var index = 0; index < this.current; index++) {
								bleInfo.ble_recv_data = "";
								let cmdStr = `01 03 ${(0x000200+index).toString(16).padStart(6, '0')} 00 01`;
								// console.log(index, '---', cmdStr);
								let modbusCmd = getModbusCmdBuf(cmdStr);
								let data;
								try {
									data = await this.writeBLECharacteristicValueAsync({
										deviceId: bleInfo.ble_device.deviceId,
										serviceId: bleInfo.ble_service.uuid,
										characteristicId: bleInfo.ble_send_characteristic.uuid,
										value: modbusCmd
									});
								} catch (err) {
									// console.log(`retry index ${index}`);
									data = await this.writeBLECharacteristicValueAsync({
										deviceId: bleInfo.ble_device.deviceId,
										serviceId: bleInfo.ble_service.uuid,
										characteristicId: bleInfo.ble_send_characteristic.uuid,
										value: modbusCmd
									});
								} finally {
									bleInfo.ble_recv_data = "";
								}
								// console.log("++++++", data);
								let datetimeArr = data.slice(0, 12).match(/.{1,6}/g);
								let collectionDataArr = data.slice(12, ).match(/.{1,8}/g).map(byteStr2Float).map(num => {
									return Number(num).toFixed(1);
								});
								let datetime = '20' + datetimeArr[0].match(/.{1,2}/g).join('-') + ' ' + datetimeArr[1].match(/.{1,2}/g).join(':');
								let rowData = `${datetime},${index+1},${collectionDataArr.join(',')}`;
								// console.log(index, '---', rowData);
								csvData += '\r\n' + rowData;
							}
							richAlert.saveFile({
								folder: this.path,
								fileName: bleInfo.ble_device.name + `_${this.getDatetime().match(/\d+/g).join('')}.csv`,
								data: csvData
							}, result => {
								// console.log("======", result);
								uni.hideLoading();
								uni.showToast({
									title: "success.",
									icon: "success"
								})
							});
							bleInfo.isCsvLoading = false;
						} else if (bleInfo.ble_device.name.includes("TILT")) {
							bleInfo.isCsvLoading = true;
							uni.showLoading({
								title: "Downloading...",
								mask: true
							});
							let csvData =
								`Model,DWL-TILT-CDSK,
SN,${bleInfo.ble_device.name.slice(5,)},,AppVersion,V1.0.0,
Logging Interval,${this.interval}min,
Download Time,${this.getDatetime()},
Battery Voltage(V),${this.batt},
Number Of Records,${this.current},
Date/Time,RECORD,Battery Voltage(V),Reading(R1),Reading(R2),Reading(R3),Reading(R4),Reading(R9),Reading(R10),Reading(R11)
,,V,Deg C,Y Axis,X Axis,Z Axis,Deg C,%RH,hPa`;
							for (var index = 0; index < this.current; index++) {
								bleInfo.ble_recv_data = "";
								let cmdStr = `01 03 ${(0x000200+index).toString(16).padStart(6, '0')} 00 01`;
								// console.log(index, '---', cmdStr);
								let modbusCmd = getModbusCmdBuf(cmdStr);
								let data;
								try {
									data = await this.writeBLECharacteristicValueAsync({
										deviceId: bleInfo.ble_device.deviceId,
										serviceId: bleInfo.ble_service.uuid,
										characteristicId: bleInfo.ble_send_characteristic.uuid,
										value: modbusCmd
									});
								} catch (err) {
									// console.log(`retry index ${index}`);
									data = await this.writeBLECharacteristicValueAsync({
										deviceId: bleInfo.ble_device.deviceId,
										serviceId: bleInfo.ble_service.uuid,
										characteristicId: bleInfo.ble_send_characteristic.uuid,
										value: modbusCmd
									});
								} finally {
									bleInfo.ble_recv_data = "";
								}
								// console.log("++++++", data);
								let datetimeArr = data.slice(0, 12).match(/.{1,6}/g);
								let collectionDataArr = data.slice(12, ).match(/.{1,8}/g).map(byteStr2Float).map((num, index) => {
									if (index < 1) {
										return Number(num).toFixed(2);
									} else if (2 <= index && index <= 4) {
										return Number(num).toFixed(4);
									} else {
										return Number(num).toFixed(1);
									}

								});
								let datetime = '20' + datetimeArr[0].match(/.{1,2}/g).join('-') + ' ' + datetimeArr[1].match(/.{1,2}/g).join(':');
								let rowData = `${datetime},${index+1},${collectionDataArr.join(',')}`;
								// console.log(index, '---', rowData);
								csvData += '\r\n' + rowData;
							}
							richAlert.saveFile({
								folder: this.path,
								fileName: bleInfo.ble_device.name + `_${this.getDatetime().match(/\d+/g).join('')}.csv`,
								data: csvData
							}, result => {
								// console.log("======", result);
								uni.hideLoading();
								uni.showToast({
									title: "success.",
									icon: "success"
								})
							});
							bleInfo.isCsvLoading = false;
						}
					});
				} catch (error) {
					//TODO handle the exception
					console.log("读取数据出错: ", error);
				} finally {
					bleInfo.ble_recv_data = "";
				}
			},
		},
		onShow() {
			if (bleInfo.ble_connected) {
				this.getInfo();
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