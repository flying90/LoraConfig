<template>
	<view class="container">
		<image src="@/static/image/log.png" style="width: 100%; height: 30px;" mode="aspectFit" @longpress="handleLogin"></image>
		<!-- 登录弹窗 -->
		<uni-popup ref="loginPopup" type="center">
			<view class="popup-content">
				<text class="popup-title">Band Config Verification</text>
				<input v-model="inputPassword" placeholder="Password" type="password" class="popup-input" />
				<button @click="verify" type="primary">confirm</button>
			</view>
		</uni-popup>

		<!-- 退出弹窗 -->
		<uni-popup ref="logoutPopup" type="center">
			<view class="popup-content">
				<text class="popup-title">Cancel Verification?</text>
				<button @click="logout" type="primary">confirm</button>
			</view>
		</uni-popup>
		<view class="divider"></view>
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
			<button v-if="!bleConnectFlag" type="primary" :loading="scanFlag" @click="startBluetoothDevicesDiscovery">Start Scan</button>
			<button v-else-if="bleConnectFlag" type="warn" @click="closeBLEConnection">Disconnect</button>
		</view>
	</view>
</template>

<script>
	import bleInfo from "@/common/common"
	import {
		ab2hex
	} from "@/common/utils"
	import {
		crcCheck,
		getModbusCmdBuf,
	} from "@/common/modbusRtu"
	export default {
		data() {
			return {
				bleDevList: [],
				inputPassword: "",
				defaultPassword: "datawave",
				scanFlag: false,
				readTimer: null,
				isBLEListenerBound: false,
			}
		},
		computed: {
			bleConnectFlag() {
				return bleInfo.ble_connected;
			},
			isLoggedIn() {
				return bleInfo.isLogged;
			}
		},
		methods: {
			handleLogin() {
				if (this.isLoggedIn) {
					this.$refs.logoutPopup.open();
				} else {
					this.$refs.loginPopup.open();
				}

			},
			verify() {
				if (this.inputPassword == this.defaultPassword) {
					bleInfo.isLogged = true;
					this.inputPassword = "";
					uni.showToast({
						title: 'success.',
						icon: 'none'
					});
					this.$refs.loginPopup.close();
				} else {
					uni.showToast({
						title: 'check password.',
						icon: 'none'
					});
				}
			},
			logout() {
				bleInfo.isLogged = false;
				uni.showToast({
					title: 'success.',
					icon: 'none'
				});
				this.$refs.logoutPopup.close();
			},
			/**
			 * 开始搜索蓝牙设备
			 */
			startBluetoothDevicesDiscovery() {
				const sysSetting = uni.getSystemSetting();
				if (sysSetting.bluetoothEnabled) {
					uni.openBluetoothAdapter({
						success: e => {
							console.log("蓝牙初始化成功");
							uni.startBluetoothDevicesDiscovery({
								powerLevel: "high",
								services: ["FFF0"],
								success: e => {
									this.bleDevList = [];
									console.log('开始搜索蓝牙设备:' + e.errMsg);
									this.scanFlag = true;
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
						fail: (e) => {
							console.log("蓝牙初始化失败，错误码：" + (e.errCode || e.errMsg));
						}
					})
				}
			},
			/**
			 * 停止搜索蓝牙设备
			 */
			stopBluetoothDevicesDiscovery() {
				if (this.scanFlag) {
					uni.stopBluetoothDevicesDiscovery({
						success: e => {
							console.log('停止搜索蓝牙设备:' + e.errMsg);
							this.scanFlag = false;
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
							if (device.name.includes("TILT") || device.name.includes("DWL4"))
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
			/***/
			handleBLEDataChange(res) {
				let resHex = ab2hex(res.value);
				// console.log("解析后数据: " + resHex);
				bleInfo.ble_recv_data += resHex;
				uni.$emit("dataArrive");
			},
			/**
			 * 读取数据缓存以防止休眠
			 */
			readCount() {
				if (bleInfo.isCsvLoading) {
					return;
				}
				bleInfo.ble_recv_data = "";
				let cmdStr = "01 03 00 00 00 00 01";
				let modbusCmd = getModbusCmdBuf(cmdStr);
				uni.writeBLECharacteristicValue({
					deviceId: bleInfo.ble_device.deviceId,
					serviceId: bleInfo.ble_service.uuid,
					characteristicId: bleInfo.ble_send_characteristic.uuid,
					value: modbusCmd,
					success: (res) => {
						// console.log("防休眠发送成功: " + res.errMsg);
						setTimeout(() => {
							if (bleInfo.ble_recv_data) {
								// console.log("ble info " + bleInfo.ble_recv_data);
								if (crcCheck(bleInfo.ble_recv_data)) {
									console.log("防休眠成功");
								} else {
									bleInfo.ble_recv_data = '';
								}
							}
						}, 500);

					},
					fail: (err) => {
						console.error("防休眠失败: " + err.errMsg);
					}
				});
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
						if (!this.isBLEListenerBound) {
							uni.onBLECharacteristicValueChange(this.handleBLEDataChange);
							this.isBLEListenerBound = true;
						}
						this.readCount();
						// 50秒读一次缓存数量以防止设备休眠
						this.readTimer = setInterval(() => {
							this.readCount();
						}, 1000 * 50);
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
				if (bleInfo.ble_connected) {
					uni.showToast({
						title: 'Connected.',
						icon: 'error',
						duration: 2000
					});
					return;
				}
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
								this.getBLEDeviceServices();
							}, 1000);
						},
						fail: e => {
							uni.hideLoading();
							console.log('连接低功耗蓝牙失败，错误码：' + e.errCode);
							bleInfo.ble_connected = false;
							uni.showToast({
								title: 'failed.',
								icon: 'error',
								duration: 2000
							});
						}
					});
				}, 600);
			},
			/**
			 * 断开与低功耗蓝牙设备的连接
			 */
			closeBLEConnection() {
				let deviceId = bleInfo.ble_device.deviceId;
				uni.closeBLEConnection({
					deviceId,
					success: res => {
						bleInfo.ble_connected = false;
						clearInterval(this.readTimer);
						console.log('断开低功耗蓝牙成功:' + res.errMsg);
					},
					fail: e => {
						console.log('断开低功耗蓝牙失败，错误码：' + e.errCode);
					}
				});
			},
			onBLEConnectionStateChange() {
				uni.onBLEConnectionStateChange(res => {
					// 该方法回调中可以用于处理连接意外断开等异常情况
					console.log(`蓝牙连接状态 -------------------------->`);
					console.log(JSON.stringify(res));
					if (!res.connected) {
						uni.showModal({
							showCancel: false,
							title: "Warning",
							content: "Bluetooth LE disconnected!",
							confirmText: "Confirm"
						});
						bleInfo.ble_connected = false;
						clearInterval(this.readTimer);
					}
				});
			}
		},
		mounted() {
			this.onBLEConnectionStateChange();
		}
	}
</script>

<style>
	.container {
		padding: 20px;
		font-size: 14px;
		line-height: 24px;
	}

	.divider {
		height: 1px;
		background-color: #ddd;
		margin: 20rpx 0;
	}

	.popup-content {
		width: 300px;
		padding: 20px;
		background-color: #fff;
		border-radius: 10px;
		text-align: center;
	}

	.popup-title {
		font-size: 18px;
		font-weight: bold;
		margin-bottom: 20px;
		display: block;
	}

	.popup-input {
		width: 100%;
		height: 50px;
		/* padding: 10px; */
		margin-bottom: 15px;
		border: 1px solid #ccc;
		border-radius: 5px;
	}

	.dialog-box {
		padding: 10px;
	}

	.dialog-text {
		font-size: 14px;
		color: #333;
	}

	.scroll_y {
		height: 77vh;
	}

	.dev_option {
		background: #F5F6F7;
		/* margin: 4px 0px; */
		border-radius: 12px;
	}

	.dev {
		display: inline-block;
		padding-bottom: 10px;
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