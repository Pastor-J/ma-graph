import './Chatbox.css'

function Chatbox({ response }) {
  return (
    <div className = 'chatbox-container'>
      { response ? response : 'Reasoning' }
    </div>
  );
};

export default Chatbox;