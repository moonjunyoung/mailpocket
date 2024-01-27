import Cookies from 'js-cookie';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { getChannelData, getSubscribeData, Token } from '../../api/api';
import Nav from '../../components/Nav'
import Symbol from '../../components/Symbol'

interface ChannelDataType {
  id: number;
  team_name: string;
  team_icon: string;
  name: string;
}


const MyPage = () => {
  const [channel, setChannel] = useState<ChannelDataType[]>([]);
  const navigate = useNavigate();
  const authToken = Token();

  useEffect(() => {
    if (!authToken) {
      navigate("/landingpage");
    }
  }, [authToken, navigate]);

  const handleChannelAdd = () => {
    window.location.href = "https://slack.com/oauth/v2/authorize?client_id=6427346365504.6466397212374&scope=incoming-webhook,team:read&user_scope=";
  }

  const handleGetChannel = async () => {
    try {
      const response = await getChannelData("/api/channel")
      setChannel(response.data)
      const responesSubscribe = await getSubscribeData("/api/newsletter/subscribe")
      if (responesSubscribe.data.length === 0) {
        navigate("/subscribe");
      }
    } catch (error) {
      console.log("Api 데이터 불러오기 실패")
    }
  }

  useEffect(() => {
    handleGetChannel()
  }, [])

  const handleLogOut = () => {
    Cookies.remove("authToken");
    navigate("/sing-in");
  };

  return (
    <div className='text-center mx-auto max-w-900 h-auto'>
      <div className='flex items-center justify-between'>
        <Nav />
        <div className="cursor-pointer" onClick={handleLogOut}>
          <div className="flex items-center font-bold" onClick={handleLogOut}>
            <span className='mr-4 underline text-customPurple'>LogOut</span>
          </div>
        </div>
      </div>
      <div className='basecontainer'>
        <Symbol />
        <div className='mt-10 bg-white relative channel-container p-7 border border-solid border-gray-100' style={{ boxShadow: '5px 5px 1px whitesmoke' }}>
          <div className='flex flex-col items-start font-bold mb-3'>
            <div className='flex'>
              <Link className="underline text-customPurple" to='/subscribe'>뉴스레터</Link><h2>의 소식을</h2>
            </div>
            <h2>{channel.length}개의 채널에 전달하고 있어요.</h2>
          </div>
          <div className='h-[232px] overflow-auto'>
            {channel.map((channeldata =>
              <div className='flex items-center gap-6' key={channeldata.id}>
                <img className="w-7 h-7 rounded-md" src={channeldata.team_icon} alt="icon" />
                <div className='flex flex-col items-start my-2'>
                  <span className='font-semibold'>{channeldata.name}</span>
                  <span className='text-sm  text-darkgray font-semibold'>{channeldata.team_name} 워크스페이스</span>
                </div>
              </div>
            ))}
          </div>
          <button className='basecontainer-submitdata' onClick={handleChannelAdd}>채널 추가하기</button>
        </div>
      </div>

    </div>
  )
}

export default MyPage