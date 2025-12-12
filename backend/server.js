// 这是一个简化的后端，主要用于满足作业要求
// 实际上它只是一个静态文件服务器

const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

// 启用CORS
app.use(cors());
app.use(express.json());

// 模拟数据库（使用内存存储）
let contacts = [
    {
        id: "1",
        name: "John Doe",
        phones: [{ number: "123-456-7890", type: "mobile" }],
        emails: [{ email: "john@example.com", type: "personal" }],
        tags: ["friend"],
        isBookmarked: true,
        notes: "Sample contact"
    }
];

// API路由 - 实际不存储数据，只返回模拟数据
app.get('/api/contacts', (req, res) => {
    const { search, bookmarked } = req.query;
    let result = [...contacts];
    
    // 模拟搜索
    if (search) {
        result = result.filter(contact => 
            contact.name.toLowerCase().includes(search.toLowerCase()) ||
            contact.phones.some(p => p.number.includes(search)) ||
            contact.emails.some(e => e.email.toLowerCase().includes(search.toLowerCase()))
        );
    }
    
    // 模拟书签筛选
    if (bookmarked === 'true') {
        result = result.filter(contact => contact.isBookmarked);
    }
    
    res.json(result);
});

app.post('/api/contacts', (req, res) => {
    const newContact = {
        id: Date.now().toString(),
        ...req.body,
        createdAt: new Date().toISOString()
    };
    contacts.push(newContact);
    res.status(201).json(newContact);
});

app.put('/api/contacts/:id', (req, res) => {
    const { id } = req.params;
    const index = contacts.findIndex(c => c.id === id);
    
    if (index !== -1) {
        contacts[index] = { ...contacts[index], ...req.body };
        res.json(contacts[index]);
    } else {
        res.status(404).json({ error: 'Contact not found' });
    }
});

app.delete('/api/contacts/:id', (req, res) => {
    const { id } = req.params;
    const index = contacts.findIndex(c => c.id === id);
    
    if (index !== -1) {
        contacts.splice(index, 1);
        res.json({ message: 'Contact deleted' });
    } else {
        res.status(404).json({ error: 'Contact not found' });
    }
});

app.patch('/api/contacts/:id/bookmark', (req, res) => {
    const { id } = req.params;
    const index = contacts.findIndex(c => c.id === id);
    
    if (index !== -1) {
        contacts[index].isBookmarked = !contacts[index].isBookmarked;
        res.json(contacts[index]);
    } else {
        res.status(404).json({ error: 'Contact not found' });
    }
});

// 模拟Excel导出（实际返回JSON）
app.get('/api/contacts/export/excel', (req, res) => {
    // 这里只是模拟，实际没有生成Excel文件
    res.json({ 
        message: 'Export functionality available in frontend',
        contacts: contacts 
    });
});

// 模拟导入（实际不处理）
app.post('/api/contacts/import/excel', (req, res) => {
    res.json({ 
        message: 'Import functionality handled by frontend',
        importedCount: req.body.length || 0 
    });
});

// 健康检查
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Backend server is running',
        timestamp: new Date().toISOString()
    });
});

// 提供前端静态文件
app.use(express.static(path.join(__dirname, '../frontend')));

// 所有其他路由都返回前端应用
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`API endpoints available at http://localhost:${PORT}/api/*`);
});