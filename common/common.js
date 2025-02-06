import { reactive } from "vue";
export default reactive({
	ble_device: null,
	ble_service: null,
	ble_recv_characteristic: null,
	ble_send_characteristic: null,
	ble_connected: false,
	ble_recv_data: "",
	isCsvLoading: false,
	isLogged: false
});