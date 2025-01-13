<template>
	<view class="container">
		<text style="font-size: 18px;">Scan Results:</text>
		<scroll-view scroll-y="true" class="scroll_y">
			<view class="dev_option" v-for="(device, index) in bleDevList" :key="index" @click="handleConnect(device)">
				<view class="dev">
					<image class="dev_ico" src="/static/image/device.png" mode="aspectFit"></image>
				</view>
				<view class="dev dev_info">
					<!-- <view class="">{{item.name}}</view> -->
					<view>Device Name: {{device.name || device.localName}}</view>
					<view>MAC: {{device.deviceId}}</view>
				</view>
				<view class="dev">
					<text>{{device.RSSI}} dBm</text>
				</view>
			</view>
		</scroll-view>
		<view class="srh_btn">
			<button type="primary" @click="startBluetoothDevicesDiscovery">Start Scan</button>
		</view>
	</view>
</template>

<script>
	import bleInfo from "@/common/common.js"
	export default {
		data() {
			return {
				bleDevList: [],
			}
		},
		computed: {

		},
		methods: {
			/**
			 * 开始搜索蓝牙设备
			 */
			startBluetoothDevicesDiscovery() {
				uni.startBluetoothDevicesDiscovery({
					success: e => {
						console.log('开始搜索蓝牙设备:' + e.errMsg);
						this.searchLoad = true;
						this.onBluetoothDeviceFound();
					},
					fail: e => {
						console.log('搜索蓝牙设备失败，错误码：' + e.errCode);
						if (e.errCode !== 0) {
							initTypes(e.errCode);
						}
					}
				});
			},
			/**
			 * 停止搜索蓝牙设备
			 */
			stopBluetoothDevicesDiscovery() {
				if (this.searchLoad) {
					uni.stopBluetoothDevicesDiscovery({
						success: e => {
							console.log('停止搜索蓝牙设备:' + e.errMsg);
							this.searchLoad = false;
						},
						fail: e => {
							console.log('停止搜索蓝牙设备失败，错误码：' + e.errCode);
						}
					});
				}
			},
			/**
			 * 发现外围设备
			 */
			onBluetoothDeviceFound() {
				uni.onBluetoothDeviceFound(devices => {
					console.log('开始监听寻找到新设备的事件');
					this.getBluetoothDevices();
				});
			},
			/**
			 * 获取在蓝牙模块生效期间所有已发现的蓝牙设备。包括已经和本机处于连接状态的设备。
			 */
			getBluetoothDevices() {
				uni.getBluetoothDevices({
					success: res => {
						this.newDeviceLoad = false;
						console.log('获取蓝牙设备成功:' + res.errMsg);
						// console.log(JSON.stringify(res))

						for (let device of res.devices) {
							if (device.name.includes("FD") || device.name.includes("DWL4"))
								this.bleDevList.push(device)
						}
					},
					fail: e => {
						console.log('获取蓝牙设备错误，错误码：' + e.errCode);
						if (e.errCode !== 0) {
							initTypes(e.errCode);
						}
					},
					complete: () => {
						this.bleDevList = [...new Map(this.bleDevList.map(device => [device.name, device]))
							.values()
						];
					}
				});
			},
			/**
			 * 将二进制数据转换为十六进制字符串
			 */
			ab2hex(buffer) {
				const hexArr = Array.prototype.map.call(
					new Uint8Array(buffer),
					function(bit) {
						return ('00' + bit.toString(16)).slice(-2)
					}
				)
				return hexArr.join('')
			},
			/**
			 * 监听处理特征值数据
			 */
			listenValueChange() {
				uni.onBLECharacteristicValueChange(res => {
					let resHex = this.ab2hex(res.value);
					// console.log("解析后数据: " + resHex);
					bleInfo.ble_recv_data += resHex;
				});
				// console.log("蓝牙缓存: " + bleInfo.ble_recv_data);
			},
			/**
			 * 开始监听特征值
			 */
			notify() {
				uni.notifyBLECharacteristicValueChange({
					deviceId: bleInfo.ble_device.deviceId, // 设备id
					serviceId: bleInfo.ble_service.uuid, // 监听指定的服务
					characteristicId: bleInfo.ble_recv_characteristic.uuid, // 监听对应的特征值
					success: (res) => {
						uni.hideLoading();
						uni.showToast({
							title: "success.",
							duration: 2000
						});
						console.log("开启监听成功: " + res.errMsg);
						bleInfo.ble_connected = true;
						this.listenValueChange();
					},
					fail(err) {
						uni.hideLoading();
						console.error("监听特征值出错:" + err);
					}
				});
			},
			/**
			 * 获取某个服务下的所有特征值
			 */
			getBLEDeviceCharacteristics() {
				uni.getBLEDeviceCharacteristics({
					// 这里的 deviceId 需要已经通过 createBLEConnection 与对应设备建立链接
					deviceId: bleInfo.ble_device.deviceId,
					// 这里的 serviceId 需要在 getBLEDeviceServices 接口中获取
					serviceId: bleInfo.ble_service.uuid,
					success: res => {
						for (let characteristic of res.characteristics) {
							if (characteristic.uuid.includes("0000FFF1")) {
								// if (characteristic.uuid.includes("0000FFF2")) {
								console.log('获取接受特征值成功:' + characteristic);
								bleInfo.ble_recv_characteristic = characteristic;
							} else if (characteristic.uuid.includes("0000FFF2")) {
								console.log('获取发送特征值成功:' + characteristic);
								bleInfo.ble_send_characteristic = characteristic;
							}
						}
						this.notify();
					},
					fail: e => {
						uni.hideLoading();
						console.log('获取特征值失败，错误码：' + e.errCode);
					}
				});
			},
			/**
			 * 获取所有服务
			 */
			getBLEDeviceServices() {
				uni.getBLEDeviceServices({
					// 这里的 deviceId 需要已经通过 createBLEConnection 与对应设备建立链接
					deviceId: bleInfo.ble_device.deviceId,
					success: res => {
						if (res.services.length > 0) {
							for (let service of res.services) {
								// if (service.uuid.includes("0000FFF0")) {
								if (service.uuid.includes("0000FFF0")) {
									bleInfo.ble_service = service;
									console.log("获取服务成功: ", service);
									// console.log("获取特征值: ", bleInfo.ble_device.deviceId, bleInfo.ble_service.uuid);
								}
							}
							this.getBLEDeviceCharacteristics();
						}
					},
					fail: e => {
						uni.hideLoading();
						console.log('获取设备服务失败，错误码：' + e.errCode);
					}
				});
			},
			/**
			 * 处理设备连接
			 */
			handleConnect(device) {
				this.stopBluetoothDevicesDiscovery();
				bleInfo.ble_device = device;
				uni.showLoading({
					mask: true,
					title: "Connecting..."
				});
				setTimeout(() => {
					uni.createBLEConnection({
						// 这里的 deviceId 需要已经通过 createBLEConnection 与对应设备建立链接
						deviceId: bleInfo.ble_device.deviceId,
						success: res => {
							console.log('连接蓝牙成功:' + res.errMsg);
							bleInfo.ble_device = device;
							setTimeout(() => {
								uni.setBLEMTU({
									deviceId: bleInfo.ble_device.deviceId,
									mtu: 247,
									success: (res) => {
										console.log("设置MTU成功: " + res.errMsg);
										setTimeout(() => {
											this.getBLEDeviceServices()
										}, 1000)
									},
									fail: (err) => {
										uni.hideLoading();
										console.log("设置MTU失败: " + err.errMsg)
									}
								});
							}, 500);
						},
						fail: e => {
							uni.hideLoading();
							console.log('连接低功耗蓝牙失败，错误码：' + e.errCode);
							bleInfo.ble_device = null;
							bleInfo.ble_service = null;
							bleInfo.ble_recv_characteristic = null;
							bleInfo.ble_send_characteristic = null;
							bleInfo.ble_connected = false;
							uni.showToast({
								title: 'failed.',
								icon: 'error',
								duration: 2000
							});
						}
					});
				}, 500);
			},
			/**
			 * 断开与低功耗蓝牙设备的连接
			 */
			closeBLEConnection() {
				let deviceId = bleInfo.ble_device.deviceId;
				uni.closeBLEConnection({
					deviceId,
					success: res => {
						console.log('断开低功耗蓝牙成功:' + res.errMsg);
						this.connectBtnStatus = false;
						this.connectedDevice = '未连接';
						bleInfo.ble_device = null;
						bleInfo.ble_service = null;
						bleInfo.ble_recv_characteristic = null;
						bleInfo.ble_send_characteristic = null;
						bleInfo.ble_connected = false;
					},
					fail: e => {
						console.log('断开低功耗蓝牙失败，错误码：' + e.errCode);
					}
				});
			}
		},
		mounted() {

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