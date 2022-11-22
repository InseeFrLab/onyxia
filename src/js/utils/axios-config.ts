import axios from "axios";

export const { axiosURL } = (() => {
    const axiosURL = axios.create();

    axiosURL.interceptors.response.use(
        response => response.data,
        error => Promise.reject(error)
    );

    return { axiosURL };
})();
