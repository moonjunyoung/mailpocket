import Cookies from "js-cookie";
import axios from "axios";

export let Token = () => Cookies.get("authToken");
const axiosData = () =>
  axios.create({
    baseURL: "https://mailpocket.site/",
    headers: {
      Authorization: Token(),
    },
  });

interface postAuthDataType {
  identifier: string,
  password: string
}


interface SlackTokenType {
  code: string
}

interface postSubscribeType {
  ids: string[]
}


// Read

export const getReadMailData = (data: string | null) => {
  return axiosData().get(`/testapi/mail?key=${data}`);
};

export const getUserData = () => {
  return axiosData().get("/testapi/user");
};


// Auth

export const postSignInData = (data: postAuthDataType) => {
  return axiosData().post("/testapi/user/sign-in", data);
};

export const postSignUpData = (data: postAuthDataType) => {
  return axiosData().post("/testapi/user/sign-up", data);
};

//slack

export const postSlackToken = (data: SlackTokenType) => {
  return axiosData().post("/testapi/channel", data);
};

export const getSlackToken = (data: any) => {
  return axiosData().get(`/testapi/${data}`);
};


// Channle

export const getChannelData = (query: string) => {
  return axiosData().get(query);
};
export const deleteChannelData = (data: number) => {
  return axiosData().delete(`/testapi/channel/${data}`);
};

// Subscribe

export const getNewsletterData = (query: string) => {
  return axiosData().get(query);
};

export const putSubscribe = (data: postSubscribeType) => {
  return axiosData().patch("/testapi/newsletter/subscribe", data);
};

export const getSubscribeData = (query: string) => {
  return axiosData().get(query);
};

