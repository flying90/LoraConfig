import { reactive } from "vue";
export default reactive({
	ble_device: null,
	ble_service: null,
	ble_recv_characteristic: null,
	ble_send_characteristic: null,
	ble_connected: false,
	ble_recv_data: "",
	isCsvLoading: false,
	isLogged: false,
	// 蓝牙密码认证是否通过。仅当 isAuthorized 为 true 时才会将 ble_connected 置 true，
	// 进而允许其它页面与设备进行数据交互
	isAuthorized: false
});