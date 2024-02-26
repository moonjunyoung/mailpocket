import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  getNewsletterData,
  getSubscribeData,
  Params,
  readPageSubscribe,
  readPageUnSubscribe,
  Token,
} from "../../api/api";
import { sendEventToAmplitude } from "../../components/Amplitude";
import { useInfiniteQuery } from "react-query";
import Nav from "../../components/Nav";
import Symbol from "../../components/Symbol";
import useIntersectionObserver from "../../hooks/useIntersectionObserver";
import { Loader } from "../../components/Loader";
import SlackGuideModal from "../../components/Modal/SlackGuideModal";
import { Category } from "../../components/Category";

export type SummaryItem = {
  [key: string]: string;
};

export type NewsLetterDataType = {
  id: number;
  name: string;
  category: string;
  mail: {
    id: number;
    subject: string;
    summary_list: SummaryItem;
    s3_object_key: string;
    newsletter_id: number;
  };
};

const Subscribe = () => {
  const [subscribeable, setSubscribeable] = useState<NewsLetterDataType[]>([]);
  const [newslettersubscribe, setNewsLettersubscribe] = useState<
    NewsLetterDataType[]
  >([]);
  const [seeMoreStates, setSeeMoreStates] = useState<{ [id: number]: boolean }>(
    {}
  );
  const [subscriptionStatusMap, setSubscriptionStatusMap] = useState<
    Record<number, boolean>
  >({});
  const navigate = useNavigate();
  const [openModal, setOpenModal] = useState(false);
  const [activeCategory, setActiveCategory] = useState("전체");

  const categories = [
    {
      id: 1,
      name: "전체",
    },
    {
      id: 2,
      name: "IT/테크",
    },
    {
      id: 3,
      name: "건강/의학",
    },
    {
      id: 4,
      name: "디자인",
    },
    {
      id: 5,
      name: "비즈/제테크",
    },
    {
      id: 6,
      name: "시사/사회",
    },
    {
      id: 7,
      name: "엔터테이먼트",
    },
    {
      id: 8,
      name: "여행",
    },
    {
      id: 9,
      name: "취미/자기계발",
    },
    {
      id: 10,
      name: "트렌드/라이프",
    },
    {
      id: 11,
      name: "푸드",
    },
  ];

  const authToken = Token();
  const ref = useRef<HTMLDivElement | null>(null);
  const pageRef = useIntersectionObserver(ref, {});
  const isPageEnd = pageRef?.isIntersecting;

  const handleNewsLetterSeeMoreSelect = (newsletterid: number) => {
    setSeeMoreStates((prevStates) => ({
      ...prevStates,
      [newsletterid]: !prevStates[newsletterid],
    }));
  };

  useEffect(() => {
    if (!authToken) {
      navigate("/landingpage");
    } else {
      sendEventToAmplitude("view select article", "");
    }
  }, [authToken, navigate]);

  const fetchNewsletter = async (
    lastId: string | undefined,
    category: string | undefined = "전체"
  ) => {
    let params: Params = {
      in_mail: true,
      subscribe_status: "subscribable",
      sort_type: "ranking",
    };

    if (lastId) {
      params.cursor = lastId;
    }

    if (category !== "전체") {
      params.category = category;
    }

    const { data } = await getNewsletterData("/testapi/newsletter", params);
    setSubscribeable((prevData) => [...prevData, ...data]);
    return data;
  };

  const { data, isFetching, fetchNextPage, isFetchingNextPage, hasNextPage } =
    useInfiniteQuery(
      ["newsletter", activeCategory],
      ({ pageParam }) => fetchNewsletter(pageParam, activeCategory),
      {
        getNextPageParam: (lastPage) => {
          const lastItem = lastPage[lastPage.length - 1];
          return lastItem ? lastItem.id : null;
        },
      }
    );

  const fetchNext = useCallback(async () => {
    const res = await fetchNextPage();
    if (res.isError) {
      console.log(res.error);
    }
  }, [fetchNextPage]);

  useEffect(() => {
    let timerId: NodeJS.Timeout | undefined;
    if (isPageEnd && hasNextPage) {
      timerId = setTimeout(() => {
        fetchNext();
      }, 500);
    }

    return () => clearTimeout(timerId);
  }, [fetchNext, isPageEnd, hasNextPage]);

  const handleGetNewsLetterData = async () => {
    try {
      const responesSubscribe = await getSubscribeData(
        "testapi/newsletter?in_mail=true&subscribe_status=subscribed&sort_type=ranking"
      );
      setNewsLettersubscribe(responesSubscribe.data);
    } catch (error) {
      console.log("Api 데이터 불러오기 실패");
    }
  };

  const handlePostNewsLetterData = async (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    e.preventDefault();
    try {
      if (newslettersubscribe.length <= 0) {
        alert("뉴스레터를 구독해주세요");
      } else {
        sendEventToAmplitude("complete to select article", "");
        window.location.href =
          "https://slack.com/oauth/v2/authorize?client_id=6427346365504.6466397212374&scope=incoming-webhook,team:read&user_scope=";
      }
    } catch (error) {
      console.log("Api 데이터 보내기 실패");
    }
  };

  const handleNewsLetterSelected = async (
    newsletterId: number,
    bool: boolean,
    newslettername: string
  ) => {
    try {
      const response = await readPageSubscribe(newsletterId);
      if (response.status === 201) {
        setSubscriptionStatusMap((prevMap) => ({
          ...prevMap,
          [newsletterId]: bool,
        }));
      }
      handleGetNewsLetterData();
      sendEventToAmplitude("select article", {
        "article name": newslettername,
      });
    } catch (error) {
      console.log("Api 데이터 불러오기 실패");
    }
  };

  const handleNewsLetterUnSelected = async (
    newsletterId: number,
    bool: boolean,
    newslettername: string
  ) => {
    try {
      const response = await readPageUnSubscribe(newsletterId);
      if (response.status === 204) {
        setSubscriptionStatusMap((prevMap) => {
          const newMap = { ...prevMap };
          delete newMap[newsletterId];
          return newMap;
        });
      }
      handleGetNewsLetterData();
      sendEventToAmplitude("select article", {
        "unselect article": newslettername,
      });
    } catch (error) {
      console.log("Api 데이터 불러오기 실패");
    }
  };

  useEffect(() => {
    handleGetNewsLetterData();
  }, []);

  const handleModalOpen = () => {
    setOpenModal(true);
  };

  const truncate = (str: string, n: number) => {
    return str?.length > n ? str.substring(0, n) + "..." : str;
  };

  return (
    <div className="mx-auto h-auto">
      <Nav />
      <div className="mx-auto max-w-[1200px] mt-10 mb-10">
        <div className="flex justify-between md:gap-8">
          <div className="flex gap-2 justify-center">
            <Symbol />
            <div
              className="flex flex-col gap-2 text-left border p-4 bg-white rounded-lg"
              style={{ boxShadow: "1px 2px lightgrey" }}
            >
              <p className="text-xs font-semibold text-gray-400">
                최근 요약 확인하고, 뉴스레터 구독하기
              </p>
              <p className="text-sm font-semibold">
                어떤 뉴스레터를 좋아하시나요?
              </p>
            </div>
          </div>
          <div>
            <button
              className="h-[45px]  rounded-3xl border-none bg-customPurple text-white text-base font-bold w-[150px] md:w-[90px] hover:scale-110 transition-transform"
              style={{ boxShadow: "0px 1px black" }}
              onClick={handleModalOpen}
            >
              선택 완료
            </button>
          </div>
        </div>
        <div className="mt-6">
          <div className="overflow-y-auto  ">
            <div className="md:p-3">
              {Object.keys(newslettersubscribe).length > 0 ? (
                <div>
                  <h1 className="mb-5 text-lg font-extrabold">
                    구독중인 뉴스레터
                  </h1>
                  <div
                    className={`${
                      newslettersubscribe.length > 4
                        ? "flex"
                        : "grid grid-cols-4"
                    } overflow-x-auto  gap-4 custom-scrollbar pb-[15px]`}
                  >
                    {newslettersubscribe.map((data) => (
                      <div
                        className=" w-full flex flex-col border rounded-md bg-white"
                        style={{ boxShadow: "-1px 5px 11px 1px lightgray" }}
                        key={data.id}
                      >
                        <div className="relative">
                          <div className="border-b h-[70px]">
                            <p className="font-extrabold p-4">
                              {data.mail
                                ? truncate(data.mail.subject, 35)
                                : "해당 뉴스레터의 새 소식을 기다리고 있어요."}
                            </p>
                          </div>
                          <div
                            className={`h-[250px] w-[285px] mb-7 ${
                              seeMoreStates[data.id]
                                ? "overflow-y-auto"
                                : "overflow-hidden"
                            } text-ellipsis custom-scrollbar px-5`}
                          >
                            {data.mail && data.mail.summary_list ? (
                              Object.entries(data.mail.summary_list).map(
                                ([key, value]) => (
                                  <div className="mt-2" key={key}>
                                    <div className="flex flex-col">
                                      <p className=" font-extrabold">{key}</p>
                                      <div className="mt-1">
                                        <span className="text-sm text-gray-500 font-semibold">
                                          {value}
                                        </span>
                                      </div>
                                    </div>
                                    {seeMoreStates[data.id] ? (
                                      <span
                                        className="font-bold text-customPurple text-sm cursor-pointer absolute right-0 bottom-0 w-full bg-white text-center border-t"
                                        onClick={() =>
                                          handleNewsLetterSeeMoreSelect(data.id)
                                        }
                                      >
                                        닫기
                                      </span>
                                    ) : (
                                      <span
                                        className="font-bold text-customPurple text-sm cursor-pointer absolute right-0 bottom-0 w-full bg-white text-center border-t"
                                        onClick={() =>
                                          handleNewsLetterSeeMoreSelect(data.id)
                                        }
                                      >
                                        더보기
                                      </span>
                                    )}
                                  </div>
                                )
                              )
                            ) : (
                              <p className="text-sm text-gray-500 font-semibold p-3">
                                소식이 생기면 메일포켓이 빠르게 요약해서
                                전달해드릴게요.
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex justify-between items-center p-3 border-t">
                          <div className="flex items-center gap-2">
                            <img
                              className="w-[30px] h-[30px] rounded-3xl"
                              src={`/images/${data.id}.png`}
                              alt="newslettericon"
                            />
                            <span className="font-bold text-sm my-1 md:w-[55px]">
                              {data.name}
                            </span>
                          </div>
                          <span
                            className="p-2 rounded-xl border border-gray-200 bg-gray-200 text-gray-400 cursor-pointer text-xs font-bold"
                            onClick={() =>
                              handleNewsLetterUnSelected(
                                data.id,
                                false,
                                data.name
                              )
                            }
                          >
                            구독해제
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                ""
              )}
            </div>
            <div className="flex items-center mt-8">
              <div className="flex gap-[10px]">
                <Category
                  fetchNewsletter={fetchNewsletter}
                  activeCategory={activeCategory}
                  setActiveCategory={setActiveCategory}
                  categories={categories}
                  setSubscribeable={setSubscribeable}
                  newslettersubscribe={newslettersubscribe}
                ></Category>
              </div>
            </div>
            <h1 className="my-5 text-lg font-extrabold md:p-3">
              구독 가능한 뉴스레터
            </h1>
            <div className="grid grid-cols-4 gap-5 items-start md:grid-cols-1 md:m-3">
              {subscribeable.map((data) => (
                <div
                  className="flex flex-col justify-between w-full border rounded-md bg-white"
                  style={{ boxShadow: "-1px 5px 11px 1px lightgray" }}
                  key={data.id}
                >
                  <div className="relative">
                    <div className="border-b h-[65px]">
                      <p className="font-extrabold p-3">
                        {data.mail
                          ? truncate(data.mail.subject, 35)
                          : "해당 뉴스레터의 새 소식을 기다리고 있어요."}
                      </p>
                    </div>
                    <div
                      className={`h-[250px] mb-7 ${
                        seeMoreStates[data.id]
                          ? "overflow-auto"
                          : "overflow-hidden"
                      } custom-scrollbar px-5`}
                    >
                      {data.mail && data.mail.summary_list ? (
                        Object.entries(data.mail.summary_list).map(
                          ([key, value]) => (
                            <div className="mt-2" key={key}>
                              <p className=" font-extrabold">{key}</p>
                              <span className="text-sm text-gray-500 font-semibold">
                                {value}
                              </span>
                              {seeMoreStates[data.id] ? (
                                <span
                                  className="font-bold text-customPurple text-sm cursor-pointer absolute right-0 bottom-0 w-full bg-white text-center border-t"
                                  onClick={() =>
                                    handleNewsLetterSeeMoreSelect(data.id)
                                  }
                                >
                                  닫기
                                </span>
                              ) : (
                                <span
                                  className="font-bold text-customPurple text-sm cursor-pointer absolute right-0 bottom-0 w-full bg-white text-center border-t"
                                  onClick={() =>
                                    handleNewsLetterSeeMoreSelect(data.id)
                                  }
                                >
                                  더보기
                                </span>
                              )}
                            </div>
                          )
                        )
                      ) : (
                        <p className="text-sm text-gray-500 font-semibold p-3">
                          소식이 생기면 메일포켓이 빠르게 요약해서
                          전달해드릴게요.
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex  justify-between items-center p-3 border-t">
                    <div className="flex items-center gap-2">
                      <img
                        className="w-[30px] h-[30px] rounded-3xl"
                        src={`/images/${data.id}.png`}
                        alt="newslettericon"
                      />
                      <span className="font-bold text-sm my-1 md:w-[55px]">
                        {data.name}
                      </span>
                    </div>
                    {subscriptionStatusMap[data.id] ? (
                      <span
                        className="p-2 rounded-xl border border-gray-200 bg-gray-200 text-gray-400 cursor-pointer text-xs font-bold"
                        onClick={() =>
                          handleNewsLetterUnSelected(data.id, false, data.name)
                        }
                      >
                        구독해제
                      </span>
                    ) : (
                      <span
                        className="p-2 rounded-xl border border-customPurple text-customPurple text-xs font-bold cursor-pointer bg-subscribebutton"
                        onClick={() =>
                          handleNewsLetterSelected(data.id, true, data.name)
                        }
                      >
                        구독하기
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="fixed  bottom-[25px] left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <button
              className="h-[45px]  rounded-3xl border-2 bg-customPurple text-white text-base font-bold w-[150px] md:w-[90px] hover:scale-110 transition-transform"
              onClick={handleModalOpen}
            >
              선택 완료
            </button>
          </div>
        </div>
      </div>
      {openModal && (
        <SlackGuideModal
          setOpenModal={setOpenModal}
          handlePostNewsLetterData={handlePostNewsLetterData}
          newslettersubscribe={newslettersubscribe}
        />
      )}
      <div className="w-full  touch-none h-10 mb-10" ref={ref}></div>
      {isFetching && hasNextPage && <Loader />}
    </div>
  );
};

export default Subscribe;
