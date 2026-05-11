<template>
	<view class="container">
		<view class="usage-container">
			<text style="font-size: 14px; color: #ADAFC1;">Capacity Usage:</text>
			<view>
				<text style="color: #FFFFFF;">{{current}}</text>
				<text style="color: #ADAFC1;"> / </text>
				<text style="color: #ADAFC1;">{{total}}</text>
			</view>
			<view style="color: #ADAFC1;">{{percent}}%</view>
		</view>
		<progress active="true" :percent="percent" stroke-width="10" style="margin: 10px 16px;" />
		<view class="download-container">
			<text style="font-size: 14px; margin-top: 14px; margin-left: 12px; color: #ADAFC1;">Download Path: </text>
			<input type="text" :value="path" style="height: 28px; font-size: 14px; margin: 10px 12px; color: #5C5E6F;" disabled />
			<!-- <view class="dw_btn">
				<view class="btn_group">
					<button plain :disabled="btnDisabled" @click="wipeFlash" style="background: #1E1E26; border-color: #1E73FE; color: #1E73FE;">Wipe Flash</button>
					<button type="primary" :disabled="btnDisabled" @click="getData">Download</button>
				</view>
			</view> -->
		</view>
		<view class="timezone-container">
			<view style="margin-top: 20px;">
				<!-- 时区选择 -->
				<text style="font-size: 14px; margin-top: 14px; margin-left: 12px; color: #ADAFC1;">Time Zone: </text>
				<uni-data-select v-model="offset" :localdata="timeZones" @change="onTimezoneChange" :clear="false"
					style="width: 80vw; margin-top: 14px; margin-left: 12px; color: #ADAFC1;"></uni-data-select>
			</view>
		</view>
		<label class="checkbox">
			<checkbox value="r1" :checked="rangeDonwloadFlag" @click="rangeDonwloadFlag = true; allDownloadFlag = false;" />Download by date range
		</label>
		<view class="download-config-container">
			<view style="margin-top: 20px;">
				<text style="font-size: 14px; margin-top: 14px; margin-left: 12px; color: #ADAFC1;">Range: </text>
				<view class="download-range-picker">
					<uni-datetime-picker :disabled="!rangeDonwloadFlag" v-model="datetimerange" type="datetimerange" rangeSeparator="-" />
				</view>
			</view>
		</view>
		<label class="checkbox">
			<checkbox value="r2" :checked="allDownloadFlag" @click="rangeDonwloadFlag = false; allDownloadFlag = true;" />Download All
		</label>
		<view class="dw_btn">
			<view class="btn_group">
				<button type="primary" :disabled="btnDisabled" @click="getData">Download</button>
				<button type="warn" :disabled="btnDisabled" @click="wipeFlash">Wipe Flash</button>
			</view>
		</view>
		<!-- 全屏遮罩层（覆盖所有内容，拦截操作） -->
		<view v-if="showProgress" class="fullscreen-mask" @touchmove.stop.prevent="handlePrevent" @click.stop.prevent="handlePrevent">
			<!-- 进度条容器（居中显示） -->
			<view class="progress-wrapper">
				<text class="progress-text">Downloading, please do not exit!</text>
				<progress :percent="downloadPercent" activeColor="#00ff00" stroke-width="12" :active="true" active-mode="forwards" />
				<text class="progress-text">{{ downloadPercent }}%</text>
			</view>
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
				datetimerange: [],
				rangeDonwloadFlag: true,
				allDownloadFlag: false,
				path: '/Documents/LoraWAN',
				total: 200000,
				cacheCount: 0,
				current: 0,
				readCount: 0,
				targetFile: null,
				fileContent: null,
				batt: 0,
				interval: 0,
				showProgress: false, // 控制遮罩层显示
				downloadPercent: 0, // 下载进度百分比
				offset: 0,
				timeZones: [{
						text: "UTC-12:00",
						value: 720
					},
					{
						text: "UTC-11:00",
						value: 660
					},
					{
						text: "UTC-10:00",
						value: 600
					},
					{
						text: "UTC-09:00",
						value: 540
					},
					{
						text: "UTC-08:00",
						value: 480
					},
					{
						text: "UTC-07:00",
						value: 420
					},
					{
						text: "UTC-06:00",
						value: 360
					},
					{
						text: "UTC-05:00",
						value: 300
					},
					{
						text: "UTC-04:00",
						value: 240
					},
					{
						text: "UTC-03:00",
						value: 180
					},
					{
						text: "UTC-02:00",
						value: 120
					},
					{
						text: "UTC-01:00",
						value: 60
					},
					{
						text: "UTC+00:00",
						value: 0
					},
					{
						text: "UTC+01:00",
						value: -60
					},
					{
						text: "UTC+02:00",
						value: -120
					},
					{
						text: "UTC+03:00",
						value: -180
					},
					{
						text: "UTC+03:30",
						value: -210
					},
					{
						text: "UTC+04:00",
						value: -240
					},
					{
						text: "UTC+04:30",
						value: -270
					},
					{
						text: "UTC+05:00",
						value: -300
					},
					{
						text: "UTC+05:30",
						value: -330
					},
					{
						text: "UTC+05:45",
						value: -345
					},
					{
						text: "UTC+06:00",
						value: -360
					},
					{
						text: "UTC+07:00",
						value: -420
					},
					{
						text: "UTC+08:00",
						value: -480
					},
					{
						text: "UTC+09:00",
						value: -540
					},
					{
						text: "UTC+09:30",
						value: -570
					},
					{
						text: "UTC+10:00",
						value: -600
					},
					{
						text: "UTC+10:30",
						value: -630
					},
					{
						text: "UTC+11:00",
						value: -660
					},
					{
						text: "UTC+12:00",
						value: -720
					},
					{
						text: "UTC+12:45",
						value: -765
					},
					{
						text: "UTC+14:00",
						value: -840
					}
				],
				selectedIndex: 0,
			}
		},
		// watch: {
		// 	datetimerange(newval) {
		// 		console.log('范围选:', this.datetimerange);
		// 	}
		// },
		computed: {
			percent() {
				return (this.current / this.total * 100).toFixed(0)
			},
			btnDisabled() {
				return !bleInfo.ble_connected;
			}
		},
		methods: {
			getTimeZone() {
				this.offset = new Date().getTimezoneOffset();
				this.selectedIndex = this.timeZones.findIndex(zone => zone.value === this.offset);
			},
			getTargetFile() {
				const filePicker = uni.requireNativePlugin("DCloud-FilePicker");
				filePicker.getAllFiles({
					folder: this.path
				}, (res) => {
					console.log("Get Target File: ", res);
					if (res.length > 0) {
						this.targetFile = res.filter(fileName => fileName === `${bleInfo.ble_device.name}.csv`)[0];
						filePicker.readFile({
							path: `/sdcard/${this.path}/${this.targetFile}`
						}, (res) => {
							console.log("Filter File Content:", res);
							if (res.res.length > 0) {
								this.fileContent = res.res;
								this.readCount = Number(res.res.match(/Number Of Records,(\d+)/)[1]);
							} else {
								console.log("file is empty.");
							}
						});
					}
				});
			},
			requestPermission() {
				const filePicker = uni.requireNativePlugin("DCloud-FilePicker");
				filePicker.requestPermission();
			},
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
			clear() {
				bleInfo.ble_recv_data = "";
				let cmdStr = "01 06 00 01 05 43 4C 46 53";
				let modbusCmd = getModbusCmdBuf(cmdStr);
				uni.writeBLECharacteristicValue({
					deviceId: bleInfo.ble_device.deviceId,
					serviceId: bleInfo.ble_service.uuid,
					characteristicId: bleInfo.ble_send_characteristic.uuid,
					value: modbusCmd,
					success: (res) => {
						uni.$once("dataArrive", () => {
							if (bleInfo.ble_recv_data) {
								if (crcCheck(bleInfo.ble_recv_data)) {
									let data = bleInfo.ble_recv_data.slice(6, bleInfo.ble_recv_data.length - 4).match(/.{1,8}/g);
									uni.showToast({
										title: "success"
									})
								} else {
									uni.showToast({
										title: "failed",
										icon: "error"
									});
									bleInfo.ble_recv_data = '';
								}
							}
						});
					},
					fail: (err) => {
						console.error("清除缓存失败: " + err.errMsg);
						uni.showToast({
							title: "failed",
							icon: "error",
							duration: 2000
						})
					}
				});
			},
			wipeFlash() {
				uni.showModal({
					title: "Wipe Verification",
					content: 'Please enter "OK" to confirm the operation!',
					editable: true,
					cancelText: "Cancel",
					confirmText: "Confirm",
					success: (res) => {
						if (res.confirm) {
							console.log('用户点击确定: ', res.content);
							if (res.content.toUpperCase() === "OK") {
								this.clear();
							} else {
								uni.showToast({
									title: "failed",
									icon: "error"
								})
							}
						} else if (res.cancel) {
							console.log('用户点击取消: ', res.content);
						}
					}
				})
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
								this.cacheCount = byteStr2Int(data[0]);
								this.current = this.cacheCount < 200000 ? this.cacheCount : 200000;
								this.batt = byteStr2Int(data[3]) / 100;
								this.interval = byteStr2Float(data[15]);
								// console.log(this.current, this.batt, this.interval);
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
				console.log(`时间范围：${this.rangeDonwloadFlag}, 增量下载：${this.allDownloadFlag}`);
				console.log(`范围下载${this.rangeDonwloadFlag},增量下载：${this.allDownloadFlag}`);
				bleInfo.ble_recv_data = "";
				if (this.rangeDonwloadFlag) {
					console.log(`时间范围下载`);
					try {
						const filePicker = uni.requireNativePlugin("DCloud-FilePicker");
						this.getInfo();
						uni.$once("currentReady", async () => {
							if (this.datetimerange.length > 0) {
								// 1. 查询开始时间对应缓存寄存器地址
								let startTimeStr = this.datetimerange[0];
								startTimeStr = this.applyTimezoneOffset(startTimeStr, this.timeZones[this.selectedIndex].text);
								let parts = startTimeStr.split(/\D+/).filter(Boolean);
								let queryHexStr = `01 15 00 01 40 00 02 ${parts[0]+ parts[1]+ parts[2]+"00"+ parts[3]+ parts[4]+ parts[5]}`;
								console.log(`开始时间查询指令：${queryHexStr}`);
								let modbusCmd = getModbusCmdBuf(queryHexStr);
								let data = await this.getRegAddrByDateTimeAsync({
									deviceId: bleInfo.ble_device.deviceId,
									serviceId: bleInfo.ble_service.uuid,
									characteristicId: bleInfo.ble_send_characteristic.uuid,
									value: modbusCmd
								});
								console.log(`开始寄存器索引：${data}`);
								let startRegAddr = data;
								bleInfo.ble_recv_data = "";

								// 2. 查询结束时间对应缓存寄存器地址
								let endTimeStr = this.datetimerange[1];
								endTimeStr = this.applyTimezoneOffset(endTimeStr, this.timeZones[this.selectedIndex].text);
								parts = endTimeStr.split(/\D+/).filter(Boolean);
								queryHexStr = `01 15 00 01 40 00 02 ${parts[0]+ parts[1]+ parts[2]+"00"+ parts[3]+ parts[4]+ parts[5]}`;
								console.log(`结束时间查询指令：${queryHexStr}`);
								modbusCmd = getModbusCmdBuf(queryHexStr);
								data = await this.getRegAddrByDateTimeAsync({
									deviceId: bleInfo.ble_device.deviceId,
									serviceId: bleInfo.ble_service.uuid,
									characteristicId: bleInfo.ble_send_characteristic.uuid,
									value: modbusCmd
								});
								console.log(`结束寄存器索引：${data}`);
								let endRegAddr = data;
								bleInfo.ble_recv_data = "";
								const fileName = `${bleInfo.ble_device.name}_${startTimeStr.match(/\d/g).join('')}_${endTimeStr.match(/\d/g).join('')}.csv`
								// 3. 开始轮询数据
								await this.handleDatetimeRangeDeviceData(filePicker, startRegAddr, endRegAddr, fileName);
							}
						});
					} catch (error) {
						console.log(error);
					} finally {
						bleInfo.ble_recv_data = "";
					}
				} else if (this.allDownloadFlag) {
					console.log(`增量下载`);
					try {
						const filePicker = uni.requireNativePlugin("DCloud-FilePicker");
						this.getInfo();
						this.getTargetFile();
						uni.$once("currentReady", async () => {
							if (bleInfo.ble_device.name.includes("DWL4I") || bleInfo.ble_device.name.includes("TILTI")) {
								await this.handleDeviceData(filePicker);
							}
						});
					} catch (error) {
						console.error("读取数据出错: ", error);
					} finally {
						bleInfo.ble_recv_data = "";
					}
				}

			},
			async handleDeviceData(filePicker) {
				try {
					bleInfo.isCsvLoading = true;
					this.showProgress = true;
					this.downloadPercent = 0;
					uni.hideTabBar();

					let deviceType = bleInfo.ble_device.name.includes("DWL4I") ? "DWL4I" : "TILTI";
					let csvData = this.generateCsvHeader(deviceType);
					let increment;
					let baseAddr;
					if (this.cacheCount <= 200000) {
						increment = this.cacheCount - this.readCount;
						baseAddr = 0x000200;
					} else {
						increment = 200000;
						baseAddr = this.cacheCount - 200000 + 0x000200;
					}

					for (let index = 0; index < increment; index++) {
						bleInfo.ble_recv_data = "";
						let cmdStr = `01 03 ${(baseAddr + this.readCount + index).toString(16).padStart(6, '0')} 00 01`;
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
							data = await this.writeBLECharacteristicValueAsync({
								deviceId: bleInfo.ble_device.deviceId,
								serviceId: bleInfo.ble_service.uuid,
								characteristicId: bleInfo.ble_send_characteristic.uuid,
								value: modbusCmd
							});
						} finally {
							bleInfo.ble_recv_data = "";
						}
						let rowData = this.processData(deviceType, data, index, this.readCount);
						// console.log(`${index + 1} -------- ${rowData}`);
						csvData += `\n${rowData}`;
						this.downloadPercent = Number((index / this.current * 100).toFixed(0));
					}

					this.saveCsvFile(filePicker, csvData);
					uni.showToast({
						title: "success.",
						duration: 1600
					});
				} catch (error) {
					console.error("处理设备数据时出错: ", error);
					uni.showToast({
						title: "failed.",
						icon: "error"
					})
				} finally {
					bleInfo.isCsvLoading = false;
					this.showProgress = false;
					setTimeout(() => {
						uni.showTabBar({
							success: (res) => {
								console.log("show tab bar success: ", res);
							},
							fail: (res) => {
								console.log("show tab bar failed: ", res);
							}
						});
					}, 2000);
				}
			},
			generateCsvHeader(deviceType) {
				if (deviceType === "DWL4I") {
					if (this.fileContent === null || this.fileContent === undefined) {
						return `Model,DWLI-TILTI-CDSK,
SN,${bleInfo.ble_device.name.slice(5,)},,AppVersion,V2.0.0,
Logging Interval,${this.interval}min,
Download Time,${this.getDatetime()},
Battery Voltage(V),${this.batt},
Number Of Records,${this.current},
Date/Time,RECORD,Battery Voltage(V),Reading(R1),Reading(R2),Reading(R3),Reading(R4),Reading(R5),Reading(R6),Reading(R7),Reading(R8),Reading(R9),Reading(R10),Reading(R11),
,,V,Hz,DegC,Hz,DegC,Hz,DegC,Hz,DegC,DegC,%RH,hPa`;
					} else {
						let data = this.fileContent.replace(this.fileContent.match(/Number Of Records,(\d+)/)[0], `Number Of Records,${this.current}`);
						return data.slice(0, data.length - 1);
					}
				} else if (deviceType === "TILTI") {
					if (this.fileContent === null || this.fileContent === undefined) {
						return `Model,DWLI-TILTI-CDSK,
SN,${bleInfo.ble_device.name.slice(5,)},,AppVersion,V2.0.0,
Logging Interval,${this.interval}min,
Download Time,${this.getDatetime()},
Battery Voltage(V),${this.batt},
Number Of Records,${this.current},
Date/Time,RECORD,Battery Voltage(V),Reading(R1),Reading(R2),Reading(R3),Reading(R4),Reading(R9),Reading(R10),Reading(R11)
,,V,DegC,X Axis,Y Axis,Z Axis,DegC,%RH,hPa`;
					} else {
						let data = this.fileContent.replace(this.fileContent.match(/Number Of Records,(\d+)/)[0], `Number Of Records,${this.current}`);
						return data.slice(0, data.length - 1);
					}
				}
			},
			processData(deviceType, data, index, readCount) {
				let datetimeArr = data.slice(0, 12).match(/.{1,6}/g);
				let collectionDataArr = data.slice(12).match(/.{1,8}/g).map(byteStr2Float).map((num, index) => {
					if (deviceType === "DWL4I") {
						if (index < 1) {
							return Number(num).toFixed(2);
						} else {
							return Number(num).toFixed(1);
						}
					} else if (deviceType === "TILTI") {
						if (index < 1) {
							return Number(num).toFixed(2);
						} else if (2 <= index && index <= 4) {
							return Number(num).toFixed(4);
						} else {
							return Number(num).toFixed(1);
						}
					}
				});

				let utcDatetimeStr = '20' + datetimeArr[0].match(/.{1,2}/g).join('-') + ' ' + datetimeArr[1].match(/.{1,2}/g).join(':');
				let datetime = this.convertToTimeZoneWithoutIntl(utcDatetimeStr, this.timeZones[this.selectedIndex].text);
				return `${datetime},${index + readCount +  1},${collectionDataArr.join(',')}`;
			},
			saveCsvFile(filePicker, csvData, customFileName = null) {
				const finalFileName = customFileName ? customFileName : `${bleInfo.ble_device.name}.csv`;

				filePicker.saveFile({
					folder: this.path,
					fileName: finalFileName,
					data: csvData,
					overwrite: true
				}, (res) => {
					if (res.length > 0) {
						uni.showToast({
							title: "failed.",
							icon: "error",
							duration: 1500
						});
					}
				});
			},
			handlePrevent() {

			},
			onTimezoneChange(e) {
				// 更新时区选择
				console.log(e)
				// console.log(this.offset)
				this.selectedIndex = this.timeZones.findIndex(zone => zone.value === e);
				// console.log('选中的时区:', this.timeZones[this.selectedIndex].text);
				// this.convertedTime = this.convertToTimeZoneWithoutIntl(this.deviceUTC,this.timeZones[this.selectedIndex].text);
			},
			/**
			 * 將特定時區的當地時間轉換為 UTC 時間
			 * @param {string} timeStr - 時間字串，格式為 "yyyy-mm-dd HH:MM:SS"
			 * @param {string} timezoneStr - 時區字串，例如 "UTC+08:00" 或 "UTC-05:00"
			 * @returns {string} - 偏移後的時間字串 (UTC 時間)，格式為 "yyyy-mm-dd HH:MM:SS"
			 */
			applyTimezoneOffset(timeStr, timezoneStr) {
				// 1. 將輸入的時間字串中的空格替換為 "T"，使其符合 ISO 8601 規範
				// "2026-05-09 16:32:00" -> "2026-05-09T16:32:00"
				const isoTimeStr = timeStr.replace(' ', 'T');

				// 2. 利用正規表示式提取時區偏移量，例如從 "UTC+08:00" 提取 "+08:00"
				const offsetMatch = timezoneStr.match(/UTC([+-]\d{2}:\d{2})/i);
				if (!offsetMatch) {
					throw new Error('時區格式無效，請使用 "UTC+xx:xx" 或 "UTC-xx:xx" 的格式');
				}
				const offset = offsetMatch[1]; // 取得 "+08:00"

				// 3. 組合成本地時間加上時區標記的完整字串
				// 結果範例："2026-05-09T16:32:00+08:00"
				const standardIsoStr = `${isoTimeStr}${offset}`;

				// 4. 交給原生的 Date 物件進行解析
				// 引擎會自動理解這個時間是相對於 UTC 偏移過的，並在內部存為正確的 UTC 毫秒數
				const dateObj = new Date(standardIsoStr);

				// 驗證日期是否有效
				if (isNaN(dateObj.getTime())) {
					throw new Error('無效的時間格式');
				}

				// 5. 轉回 UTC 時間的 ISO 字串
				// toISOString() 永遠回傳 UTC 時間，格式類似 "2026-05-09T08:32:00.000Z"
				const utcIsoStr = dateObj.toISOString();

				// 6. 截取我們需要的部分並替換 "T" 回空格，恢復原本的格式
				return utcIsoStr.replace('T', ' ').substring(0, 19);
			},
			convertToTimeZoneWithoutIntl(dateStr, targetUtcOffsetStr, options = {}) {
				const defaultOptions = {
					includeSeconds: true,
					includeDate: true,
					separator: ' ',
				};
				options = {
					...defaultOptions,
					...options
				};
				let utcDate = dateStr.replace(' ', 'T') + 'Z'; // 将空格替换为T，符合ISO 8601标准
				let date = new Date(utcDate);
				// 1. 解析目标时区的偏移量
				const offsetRegex = /^UTC([+-])(\d{2}):(\d{2})$/;
				const match = targetUtcOffsetStr.match(offsetRegex);

				if (!match) {
					console.error("Invalid UTC offset format. Expected 'UTC+HH:MM' or 'UTC-HH:MM'.");
					return date.toISOString(); // 返回默认的 ISO 格式作为 fallback
				}

				const sign = match[1] === '+' ? 1 : -1;
				const offsetHours = parseInt(match[2], 10);
				const offsetMinutes = parseInt(match[3], 10);
				const targetOffsetMilliseconds = sign * (offsetHours * 60 + offsetMinutes) * 60 * 1000;

				// 2. 获取原始时间的 UTC 时间戳 (Date 对象内部就是 UTC 时间戳)
				const utcTimestamp = date.getTime();

				// 3. 获取本地时区与 UTC 的偏移量（以分钟为单位）
				// 注意：getTimezoneOffset() 返回的是本地时区与 UTC 的分钟差，
				// 且其值为正表示本地时区落后于 UTC，负表示本地时区领先于 UTC。
				// 例如：PDT (UTC-07:00) 返回 420 (正数，因为比UTC慢7小时)
				// 北京 (UTC+08:00) 返回 -480 (负数，因为比UTC快8小时)
				const localTimezoneOffsetMinutes = date.getTimezoneOffset(); // in minutes

				// 将本地时区偏移量转换为毫秒
				const localTimezoneOffsetMilliseconds = localTimezoneOffsetMinutes * 60 * 1000;

				// 4. 计算调整后的时间戳
				// 目标时区的毫秒 = UTC 毫秒 + 目标时区相对于 UTC 的偏移毫秒
				// 例如：
				// 如果目标是 UTC+8， targetOffsetMilliseconds = +8 * 60 * 60 * 1000
				// 如果目标是 UTC-5， targetOffsetMilliseconds = -5 * 60 * 60 * 1000
				//
				// JavaScript Date 对象的方法 (getHours(), getMinutes() 等) 在没有 Intl 支持时，
				// 默认是基于 "本地时区" 来解释内部存储的 UTC 毫秒数。
				// 所以，我们需要计算出目标时区与本地时区之间的“相对偏移”，然后调整 Date 对象。
				//
				// 方法一：先转换为 UTC 时间，再应用目标偏移量。
				// date.getTime() 已经是 UTC 毫秒数。
				// targetDateInTargetOffset = new Date(utcTimestamp + targetOffsetMilliseconds);
				//
				// 此时，targetDateInTargetOffset 内部的毫秒数代表了目标时区实际的 UTC 毫秒数。
				// 但当我们调用 targetDateInTargetOffset.getUTCHours() 时，它会返回其内部 UTC 毫秒数对应的 UTC 小时。
				// 而我们想要的是目标时区的小时，所以我们需要使用 getUTCHours() 方法。
				//
				// 5. 手动格式化
				const targetDate = new Date(utcTimestamp + targetOffsetMilliseconds);

				// 获取目标时区的时间组件 (使用 UTC 方法，因为 targetDate 的内部毫秒数已经被调整为目标时区所对应的 UTC 毫秒)
				const year = targetDate.getUTCFullYear();
				const month = (targetDate.getUTCMonth() + 1).toString().padStart(2, '0'); // 月份从0开始
				const day = targetDate.getUTCDate().toString().padStart(2, '0');
				const hours = targetDate.getUTCHours().toString().padStart(2, '0');
				const minutes = targetDate.getUTCMinutes().toString().padStart(2, '0');
				const seconds = targetDate.getUTCSeconds().toString().padStart(2, '0');

				let formattedDate = '';
				if (options.includeDate) {
					formattedDate += `${year}-${month}-${day}`;
				}

				let formattedTime = `${hours}:${minutes}`;
				if (options.includeSeconds) {
					formattedTime += `:${seconds}`;
				}

				if (options.includeDate && formattedTime) {
					return `${formattedDate}${options.separator}${formattedTime}`;
				} else if (options.includeDate) {
					return formattedDate;
				} else {
					return formattedTime;
				}
			},
			getRegAddrByDateTimeAsync({
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
								if (crcCheck(bleInfo.ble_recv_data)) {
									let data = bleInfo.ble_recv_data.slice(10, bleInfo.ble_recv_data.length - 4);
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
			processDatetimeRangeData(deviceType, data, addr, startAddr) {
				let datetimeArr = data.slice(0, 12).match(/.{1,6}/g);
				let collectionDataArr = data.slice(12).match(/.{1,8}/g).map(byteStr2Float).map((num, index) => {
					if (deviceType === "DWL4I") {
						if (index < 1) {
							return Number(num).toFixed(2);
						} else {
							return Number(num).toFixed(1);
						}
					} else if (deviceType === "TILTI") {
						if (index < 1) {
							return Number(num).toFixed(2);
						} else if (2 <= index && index <= 4) {
							return Number(num).toFixed(4);
						} else {
							return Number(num).toFixed(1);
						}
					}
				});

				let utcDatetimeStr = '20' + datetimeArr[0].match(/.{1,2}/g).join('-') + ' ' + datetimeArr[1].match(/.{1,2}/g).join(':');
				let datetime = this.convertToTimeZoneWithoutIntl(utcDatetimeStr, this.timeZones[this.selectedIndex].text);
				return `${datetime},${addr - startAddr +  1},${collectionDataArr.join(',')}`;
			},
			async handleDatetimeRangeDeviceData(filePicker, startReg, endReg, fileName) {
				try {
					bleInfo.isCsvLoading = true;
					this.showProgress = true;
					this.downloadPercent = 0;
					uni.hideTabBar();

					let deviceType = bleInfo.ble_device.name.includes("DWL4I") ? "DWL4I" : "TILTI";
					let csvData = this.generateCsvHeader(deviceType);
					let startAddr = parseInt(startReg, 16) + 0x000200 - 1;
					let endAddr = parseInt(endReg, 16) + 0x000200 - 1;
					const total = endAddr - startAddr + 1;
					let current = 0; // 已成功读取的数量

					for (let addr = startAddr; addr <= endAddr; addr++) {
						bleInfo.ble_recv_data = "";
						let cmdStr = `01 03 ${addr.toString(16).padStart(6, '0').toUpperCase()} 00 01`;
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
							data = await this.writeBLECharacteristicValueAsync({
								deviceId: bleInfo.ble_device.deviceId,
								serviceId: bleInfo.ble_service.uuid,
								characteristicId: bleInfo.ble_send_characteristic.uuid,
								value: modbusCmd
							});
						} finally {
							bleInfo.ble_recv_data = "";
						}
						let rowData = this.processDatetimeRangeData(deviceType, data, addr, startAddr);
						// console.log(`${index + 1} -------- ${rowData}`);
						csvData += `\n${rowData}`;
						current++;
						this.downloadPercent = Number((current / total * 100).toFixed(0));
					}
					// console.log(fileName, csvData);
					this.saveCsvFile(filePicker, csvData, fileName);
					uni.showToast({
						title: "success.",
						duration: 1600
					});
				} catch (error) {
					console.error("处理设备数据时出错: ", error);
					uni.showToast({
						title: "failed.",
						icon: "error"
					})
				} finally {
					bleInfo.isCsvLoading = false;
					this.showProgress = false;
					setTimeout(() => {
						uni.showTabBar({
							success: (res) => {
								console.log("show tab bar success: ", res);
							},
							fail: (res) => {
								console.log("show tab bar failed: ", res);
							}
						});
					}, 2000);
				}
			},
		},
		onLoad() {
			this.getTimeZone();
		},
		onShow() {
			this.requestPermission();
			if (bleInfo.ble_connected && !this.showProgress) {
				this.getInfo();
			}

			// console.log("onshow: ", this.readCount, this.targetFile, this.fileContent);
		},
	}
</script>

<style>
	.checkbox {
		color: #ADAFC1;
		font-size: 14px;
	}

	.picker {
		padding: 20px;
		font-size: 18px;
		background-color: #f5f5f5;
	}

	.container {
		padding: 10px;
		font-size: 14px;
		line-height: 24px;
	}

	.usage-container {
		display: flex;
		flex-direction: row;
		justify-content: space-between;
		font-size: 16px;
		margin-top: 24px;
		margin-left: 16px;
		margin-right: 16px;
	}

	.download-container {
		background: #1E1E26;
		height: 68px;
		margin: 24px 16px;
		border-radius: 10px;
	}

	.timezone-container {
		background: #1E1E26;
		height: 88px;
		margin: 24px 16px;
		border-radius: 10px;
	}

	.download-config-container {
		background: #1E1E26;
		height: 88px;
		margin: 24px 16px;
		border-radius: 10px;
	}

	.download-range-picker {
		margin: 14px 14px 0 14px;
	}

	.dw_btn {
		position: fixed;
		bottom: 0;
		left: 0;
		width: 100%;
	}

	.btn_group {
		display: flex;
	}

	/* 全屏遮罩层样式 */
	.fullscreen-mask {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: rgba(0, 0, 0, 0.7);
		/* 半透明黑色背景 */
		display: flex;
		justify-content: center;
		align-items: center;
		z-index: 9999;
		/* 确保在最上层 */
	}

	/* 进度条容器样式 */
	.progress-wrapper {
		width: 70%;
		background: #fff;
		padding: 20px;
		border-radius: 10px;
		text-align: center;
	}

	/* 进度百分比文字 */
	.progress-text {
		display: block;
		margin-top: 10px;
		color: #333;
		font-size: 16px;
	}

	button {
		width: 100%;
	}
</style>