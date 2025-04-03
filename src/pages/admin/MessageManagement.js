import React, { useState, useEffect } from 'react';
import { db } from '../../config/firebase'; // Đảm bảo đường dẫn đúng đến file firebase.js
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { Table, Button } from 'react-bootstrap';

const MessageManagement = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  // Hàm lấy danh sách messages từ Firestore
  const fetchMessages = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'messages'));
      const messagesList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMessages(messagesList);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching messages:', error);
      setLoading(false);
    }
  };

  // Hàm xóa message
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this message?')) {
      try {
        await deleteDoc(doc(db, 'messages', id));
        setMessages(messages.filter(message => message.id !== id));
        alert('Message deleted successfully!');
      } catch (error) {
        console.error('Error deleting message:', error);
        alert('Failed to delete message.');
      }
    }
  };

  // Gọi hàm fetchMessages khi component được mount
  useEffect(() => {
    fetchMessages();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h2>Message Management</h2>
      {messages.length === 0 ? (
        <p>No messages found.</p>
      ) : (
        <Table striped bordered hover>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Message</th>
              <th>Time</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {messages.map(message => (
              <tr key={message.id}>
                <td>{message.name}</td>
                <td>{message.email}</td>
                <td>{message.phone}</td>
                <td>{message.message}</td>
                <td>{message.timestamp?.toDate().toLocaleString()}</td>
                <td>
                  <Button variant="danger" onClick={() => handleDelete(message.id)}>
                    Delete
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
};

export default MessageManagement;