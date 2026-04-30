<template>
	<view v-if="!scanFlag && !bleConnectFlag && !connectingFlag" class="container">
		<text class="logo" @longpress="handleLogin">Ground IQ Pte Ltd</text>
		<view class="show-start">
			<image src="/static/img/search.png" mode="aspectFit"></image>
		</view>
		<view class="scan-btn">
			<button v-if="!bleConnectFlag" type="primary" :loading="scanFlag" @click="startBluetoothDevicesDiscovery">Start Scan</button>
		</view>
	</view>
	<view v-else class="container">
		<text class="logo" @longpress="handleLogin">Ground IQ Pte Ltd</text>
		<!-- <image src="@/static/image/log.jpg" style="width: 100%; height: 30px;" mode="aspectFit" @longpress="handleLogin"></image> -->
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

		<!-- 蓝牙连接密码弹窗：默认密码失败时弹出，用户输入密码后再次发起认证 -->
		<uni-popup ref="blePasswordPopup" type="center" :mask-click="false">
			<view class="popup-content">
				<text class="popup-title">Bluetooth Authentication</text>
				<input v-model="inputBlePassword" placeholder="Bluetooth Password" type="password" class="popup-input" />
				<view class="btn-group">
					<button @click="submitBlePassword" type="primary">Confirm</button>
					<button @click="cancelBlePassword" type="warn">Cancel</button>
				</view>
			</view>
		</uni-popup>
		<view class="divider"></view>
		<text style="font-size: 18px; color: #CACED4;">Scan Results:</text>
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
			<button v-if="!bleConnectFlag" type="primary" :loading="scanFlag">Scanning...</button>
			<view v-else-if="bleConnectFlag" class="btn_group">
				<button type="primary" @click="handleClick">Upgrade</button>
				<button type="warn" @click="closeBLEConnection">Disconnect</button>
			</view>
		</view>
		<uni-popup ref="configPopup" type="center" @change="configChange" :mask-click="false">
			<view class="popup-content">
				<text class="popup-title">Firmware Update</text>
				<view class="btn-group">
					<button @click="firmwareUpdate" type="primary">Firmware Update</button>
					<button @click="cancelUpdate" type="primary">Cancel</button>
				</view>

				<progress :percent="percent" show-info />
			</view>
		</uni-popup>
	</view>
</template>

<script>
	import bleInfo from "@/common/common"
	import {
		ab2hex,
		ab2str,
		str2ab
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
				// 蓝牙连接密码：默认值与用户输入值
				defaultBlePassword: "12345678",
				inputBlePassword: "",
				blePasswordPrompted: false,
				// 从开始连接到认证完成之间为 true，保证 v-else 分支保持激活，
				// 让 blePasswordPopup 始终被渲染、$refs 可用
				connectingFlag: false,
				scanFlag: false,
				readTimer: null,
				isBLEListenerBound: false,
				currentChunk: 0,
				totalChunks: 0,
				softVersion: null,
				firmwareUpdateFlag: false,
			}
		},
		computed: {
			bleConnectFlag() {
				return bleInfo.ble_connected;
			},
			isLoggedIn() {
				return bleInfo.isLogged;
			},
			percent() {
				return (this.currentChunk / this.totalChunks * 100).toFixed(0);
			},
		},
		methods: {
			handleClick(e) {
				this.$refs.configPopup.open();
				uni.hideTabBar();
			},
			configChange(e) {
				if (e.show) {
					// console.log("更新打开");
					this.firmwareUpdateFlag = true;
				} else {
					// console.log("更新关闭");
					this.firmwareUpdateFlag = false;
				}
			},
			cancelUpdate() {
				this.$refs.configPopup.close();
				uni.showTabBar({
					success: (res) => {
						console.log("show tab bar success: ", res);
					},
					fail: (res) => {
						console.log("show tab bar failed: ", res);
					}
				});
			},
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
				// 认证未通过前，回包是 ASCII 文本：
				//   成功 -> "authorized ok"
				//   失败 -> "authorized error"
				// 由于两者都以 "authorized" 开头，必须按尾部关键字 ok/error 区分。
				// 这一段不走原 hex 累加路径，避免污染后续 modbus 数据流。
				if (!bleInfo.isAuthorized) {
					let text = ab2str(res.value);
					console.log("认证阶段收到: " + text);
					if (text.indexOf("error") !== -1) {
						uni.$emit("bleAuthResult", "unauthorized");
					} else if (text.indexOf("ok") !== -1) {
						uni.$emit("bleAuthResult", "authorized");
					}
					return;
				}
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
					writeType: 'writeNoResponse',
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
						console.log("开启监听成功: " + res.errMsg);
						// 监听已就绪，但此刻还不能置 ble_connected = true，
						// 必须先通过 BLE 密码认证。绑定数据回调后立即用默认密码尝试。
						if (!this.isBLEListenerBound) {
							uni.onBLECharacteristicValueChange(this.handleBLEDataChange);
							this.isBLEListenerBound = true;
						}
						uni.showLoading({
							mask: true,
							title: "Authenticating..."
						});
						this.attemptBleAuth(this.defaultBlePassword);
					},
					fail(err) {
						uni.hideLoading();
						console.error("监听特征值出错:" + err);
					}
				});
			},
			/**
			 * 清理一次认证尝试可能残留的事件监听与超时定时器
			 */
			_clearAuthPending() {
				if (this._authTimeoutId) {
					clearTimeout(this._authTimeoutId);
					this._authTimeoutId = null;
				}
				uni.$off("bleAuthResult");
			},
			/**
			 * 发送 BLE 密码并等待 authorized/unauthorized 回包
			 * 设备在密码错误时可能完全不回数据（实测默认密码错误时设备静默丢弃），
			 * 因此除等待回包外还设置 3 秒超时兜底，超时即按未授权处理弹窗让用户继续输入。
			 * @param {string} password 待尝试的密码
			 */
			attemptBleAuth(password) {
				const frame = `BLEPASSWORD:${password}`;
				console.log("发送认证帧: " + frame);
				// 清理上一次可能残留的 listener 与 timeout，防止串台
				this._clearAuthPending();

				let settled = false;
				const finalize = (result) => {
					if (settled) return;
					settled = true;
					this._clearAuthPending();
					if (result === "authorized") {
						this.onBleAuthorized();
					} else {
						this.onBleUnauthorized();
					}
				};

				uni.$once("bleAuthResult", finalize);
				// 密码错误时设备静默丢弃，不会回 unauthorized；3 秒未拿到结果按未授权
				this._authTimeoutId = setTimeout(() => {
					console.log("认证超时，按未授权处理");
					finalize("unauthorized");
				}, 3000);

				uni.writeBLECharacteristicValue({
					deviceId: bleInfo.ble_device.deviceId,
					serviceId: bleInfo.ble_service.uuid,
					characteristicId: bleInfo.ble_send_characteristic.uuid,
					value: str2ab(frame),
					// 新固件下 FFF2 仅支持 writeNoResponse；不指定时 uni-app 默认 'write' 会
					// 返回 "property not support"
					writeType: 'writeNoResponse',
					fail: (err) => {
						console.error("发送认证帧失败: " + (err.errMsg || err.errCode));
						finalize("unauthorized");
					}
				});
			},
			/**
			 * 认证通过：解锁数据交互、关闭密码弹窗、启动防休眠循环
			 */
			onBleAuthorized() {
				bleInfo.isAuthorized = true;
				bleInfo.ble_connected = true;
				this.connectingFlag = false;
				this.inputBlePassword = "";
				if (this.blePasswordPrompted) {
					this.$refs.blePasswordPopup.close();
					this.blePasswordPrompted = false;
				}
				uni.hideLoading();
				uni.showToast({
					title: "Authorized.",
					duration: 2000
				});
				this.readCount();
				// 50秒读一次缓存数量以防止设备休眠
				this.readTimer = setInterval(() => {
					this.readCount();
				}, 1000 * 50);
			},
			/**
			 * 认证失败：弹窗让用户输入密码继续尝试
			 */
			onBleUnauthorized() {
				uni.hideLoading();
				uni.showToast({
					title: "Auth failed.",
					icon: "none",
					duration: 1500
				});
				this.inputBlePassword = "";
				if (!this.blePasswordPrompted) {
					this.blePasswordPrompted = true;
					this.$refs.blePasswordPopup.open();
				}
			},
			/**
			 * 用户在弹窗中点击 Confirm，提交密码再次发起认证
			 */
			submitBlePassword() {
				if (!this.inputBlePassword) {
					uni.showToast({
						title: "Enter password.",
						icon: "none"
					});
					return;
				}
				uni.showLoading({
					mask: true,
					title: "Authenticating..."
				});
				this.attemptBleAuth(this.inputBlePassword);
			},
			/**
			 * 用户取消密码输入：放弃认证并断开蓝牙连接
			 */
			cancelBlePassword() {
				this.inputBlePassword = "";
				this.blePasswordPrompted = false;
				this.connectingFlag = false;
				this.$refs.blePasswordPopup.close();
				this._clearAuthPending();
				if (bleInfo.ble_device) {
					uni.closeBLEConnection({
						deviceId: bleInfo.ble_device.deviceId,
						complete: () => {
							bleInfo.isAuthorized = false;
							bleInfo.ble_connected = false;
						}
					});
				}
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
				// 进入连接+认证流程，让 v-else 始终激活以确保密码弹窗 ref 可用
				this.connectingFlag = true;
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
							bleInfo.isAuthorized = false;
							this.connectingFlag = false;
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
						bleInfo.isAuthorized = false;
						this.connectingFlag = false;
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
						// 仅在已认证通过的情况下才提示掉线，避免认证阶段断开时的误报
						if (bleInfo.ble_connected) {
							uni.showModal({
								showCancel: false,
								title: "Warning",
								content: "Bluetooth LE disconnected!",
								confirmText: "Confirm"
							});
						}
						bleInfo.ble_connected = false;
						bleInfo.isAuthorized = false;
						this.connectingFlag = false;
						// 清理可能残留的认证回调监听、超时定时器与密码弹窗状态
						this._clearAuthPending();
						if (this.blePasswordPrompted) {
							this.$refs.blePasswordPopup && this.$refs.blePasswordPopup.close();
							this.blePasswordPrompted = false;
						}
						this.inputBlePassword = "";
						clearInterval(this.readTimer);
					}
				});
			},
			firmwareUpdate() {
				const deviceType = bleInfo.ble_device.name.split('-')[0];
				const ver_check_url = `http://update.sncon.cn/${deviceType}/version.json`;
				const firmware_download_url = `http://update.sncon.cn/${deviceType}/${deviceType}.bin`;
				// console.log(`版本地址:${ver_check_url},固件地址:${firmware_download_url}`);
				this.readVersion();
				uni.request({
					url: ver_check_url, //仅为示例，并非真实接口地址。
					success: (res) => {
						// console.log("云端软件版本: ", res.data.soft_ver);
						// console.log("本机软件版本: ", this.softVersion);
						if (res.data.soft_ver > this.softVersion) {
							// console.log("软件有更新");
							uni.request({
								url: firmware_download_url,
								responseType: 'arraybuffer',
								success: (res) => {
									const firmware = res.data;
									bleInfo.ble_recv_data = "";
									const cmdStr = "01 06 00 05 00 00 01";
									const requestFrame = getModbusCmdBuf(cmdStr);

									uni.writeBLECharacteristicValue({
										deviceId: bleInfo.ble_device.deviceId,
										serviceId: bleInfo.ble_service.uuid,
										characteristicId: bleInfo.ble_send_characteristic.uuid,
										value: requestFrame,
										writeType: 'writeNoResponse',
										success: (res) => {
											// console.log("通用设置发送成功: " + res.errMsg);
											uni.$once("dataArrive", () => {
												if (bleInfo.ble_recv_data) {
													console.log("ble info " + bleInfo.ble_recv_data);
													if (crcCheck(bleInfo.ble_recv_data)) {
														let data = bleInfo.ble_recv_data.slice(6, bleInfo.ble_recv_data.length - 4).match(/.{1,8}/g);
														// console.log(`更新写入回复:${data}`);
														setTimeout(() => {
															this.sendInChunks(
																firmware
															).then(() => {
																console.log("所有分片发送完成 ✅");
															}).catch(err => {
																console.error("发送失败 ❌", err);
															});
														}, 1000);
													} else {
														bleInfo.ble_recv_data = '';
													}
												}
											});
										},
										fail: (err) => {
											console.error("下发设置失败: " + err.errMsg);
											uni.showToast({
												title: "write failed.",
												icon: "error",
												duration: 2000
											})
										}
									});
								}
							})
						} else {
							uni.showToast({
								title: "No update yet."
							})
						}
						// this.printArrayBufferHex(res.data);

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

	.show-start {
		width: 240px;
		height: 240px;
		margin-top: 70px;
		margin-bottom: 70px;
		text-align: center;
		/* margin: 70px 68px; */
	}

	.scan-btn {
		width: 200px;
		height: 42px;
		margin: auto;
	}

	.btn_group {
		display: flex;
	}

	.logo {
		display: block;
		height: 30px;
		text-align: center;
		font-size: 26px;
		color: #FFF;
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
		background: #1E1E26;
		/* margin: 4px 0px; */
		border-radius: 12px;
	}

	.dev {
		display: inline-block;
		padding-bottom: 10px;
		color: #CACED4;
	}

	.dev_ico {
		width: 24px;
		height: 24px;
		margin: 0 5px 5px 5px;
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

	button {
		width: 100%;
		margin: 8px;
	}
</style>