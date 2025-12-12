// 使用 localStorage 存储联系人数据
let contacts = JSON.parse(localStorage.getItem('addressBookContacts')) || [];
let editingContactId = null;
let contactToDeleteId = null;
let currentFilter = 'all';

// 初始化页面
document.addEventListener('DOMContentLoaded', function() {
    renderContacts();
    setupModal();
});

// 渲染联系人
function renderContacts(filteredContacts = null) {
    const container = document.getElementById('contactsContainer');
    const emptyState = document.getElementById('emptyState');
    
    let displayContacts = filteredContacts || contacts;
    
    // 应用当前筛选器
    if (currentFilter === 'bookmarked') {
        displayContacts = displayContacts.filter(contact => contact.isBookmarked);
    }
    
    if (displayContacts.length === 0) {
        container.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }
    
    emptyState.style.display = 'none';
    
    let html = '';
    displayContacts.forEach(contact => {
        html += `
            <div class="col-md-6 col-lg-4 col-xl-3">
                <div class="contact-card card h-100 ${contact.isBookmarked ? 'bookmarked' : ''}">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-start mb-3">
                            <h5 class="card-title mb-0">${escapeHtml(contact.name)}</h5>
                            <div>
                                <i class="bi bi-star${contact.isBookmarked ? '-fill' : ''} star-btn" 
                                   onclick="toggleBookmark('${contact.id}')"
                                   title="${contact.isBookmarked ? 'Remove bookmark' : 'Add bookmark'}"></i>
                            </div>
                        </div>
                        
                        ${renderContactInfo(contact)}
                        
                        ${contact.tags && contact.tags.length > 0 ? `
                            <div class="mt-3">
                                ${contact.tags.map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}
                            </div>
                        ` : ''}
                        
                        ${contact.notes ? `
                            <div class="mt-3">
                                <small class="text-muted">${escapeHtml(contact.notes)}</small>
                            </div>
                        ` : ''}
                        
                        <div class="contact-actions mt-3 d-flex justify-content-end">
                            <button class="btn btn-sm btn-outline-primary me-2" 
                                    onclick="editContact('${contact.id}')">
                                <i class="bi bi-pencil"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-danger" 
                                    onclick="showDeleteModal('${contact.id}')">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// 渲染联系信息
function renderContactInfo(contact) {
    let html = '';
    
    // 电话号码
    if (contact.phones && contact.phones.length > 0) {
        contact.phones.forEach(phone => {
            html += `
                <div class="phone-number">
                    <i class="bi bi-telephone"></i>
                    <span>${escapeHtml(phone.number)}</span>
                    <small class="text-muted ms-2">(${phone.type})</small>
                </div>
            `;
        });
    }
    
    // 邮箱地址
    if (contact.emails && contact.emails.length > 0) {
        contact.emails.forEach(email => {
            html += `
                <div class="email-address">
                    <i class="bi bi-envelope"></i>
                    <span>${escapeHtml(email.email)}</span>
                    <small class="text-muted ms-2">(${email.type})</small>
                </div>
            `;
        });
    }
    
    return html;
}

// 添加电话号码字段
function addPhoneField() {
    const container = document.getElementById('phoneFields');
    const div = document.createElement('div');
    div.className = 'input-group mb-2';
    div.innerHTML = `
        <input type="tel" class="form-control" placeholder="Phone number">
        <select class="form-select" style="max-width: 120px;">
            <option value="mobile">Mobile</option>
            <option value="home">Home</option>
            <option value="work">Work</option>
        </select>
        <button type="button" class="btn btn-outline-danger" onclick="removeField(this, 'phone')">
            <i class="bi bi-trash"></i>
        </button>
    `;
    container.appendChild(div);
}

// 添加邮箱字段
function addEmailField() {
    const container = document.getElementById('emailFields');
    const div = document.createElement('div');
    div.className = 'input-group mb-2';
    div.innerHTML = `
        <input type="email" class="form-control" placeholder="Email address">
        <select class="form-select" style="max-width: 120px;">
            <option value="personal">Personal</option>
            <option value="work">Work</option>
        </select>
        <button type="button" class="btn btn-outline-danger" onclick="removeField(this, 'email')">
            <i class="bi bi-trash"></i>
        </button>
    `;
    container.appendChild(div);
}

// 删除字段
function removeField(button, type) {
    const container = document.getElementById(`${type}Fields`);
    if (container.children.length > 1) {
        button.closest('.input-group').remove();
    }
}

// 添加标签
function addTag() {
    const tagInput = document.getElementById('newTag');
    const tagContainer = document.getElementById('tagContainer');
    
    if (tagInput.value.trim()) {
        const tag = escapeHtml(tagInput.value.trim());
        const span = document.createElement('span');
        span.className = 'tag';
        span.innerHTML = `${tag} <i class="bi bi-x" onclick="removeTag(this)" style="cursor:pointer;"></i>`;
        tagContainer.appendChild(span);
        tagInput.value = '';
    }
}

// 删除标签
function removeTag(icon) {
    icon.parentElement.remove();
}

// 保存联系人
function saveContact() {
    // 收集表单数据
    const name = document.getElementById('contactName').value.trim();
    if (!name) {
        alert('Name is required');
        return;
    }
    
    // 收集电话号码
    const phones = [];
    const phoneFields = document.querySelectorAll('#phoneFields .input-group');
    phoneFields.forEach(group => {
        const input = group.querySelector('input');
        const select = group.querySelector('select');
        if (input.value.trim()) {
            phones.push({
                number: input.value.trim(),
                type: select.value
            });
        }
    });
    
    // 收集邮箱地址
    const emails = [];
    const emailFields = document.querySelectorAll('#emailFields .input-group');
    emailFields.forEach(group => {
        const input = group.querySelector('input');
        const select = group.querySelector('select');
        if (input.value.trim()) {
            emails.push({
                email: input.value.trim(),
                type: select.value
            });
        }
    });
    
    // 收集标签
    const tags = [];
    const tagElements = document.querySelectorAll('#tagContainer .tag');
    tagElements.forEach(tagEl => {
        const text = tagEl.textContent.replace('×', '').trim();
        if (text) tags.push(text);
    });
    
    // 收集其他数据
    const isBookmarked = document.getElementById('isBookmarked').checked;
    const notes = document.getElementById('contactNotes').value.trim();
    const contactId = document.getElementById('contactId').value;
    
    // 创建联系人对象
    const contact = {
        id: contactId || Date.now().toString(),
        name: name,
        phones: phones,
        emails: emails,
        tags: tags,
        isBookmarked: isBookmarked,
        notes: notes,
        createdAt: new Date().toISOString()
    };
    
    // 保存到数组
    if (editingContactId) {
        // 更新现有联系人
        const index = contacts.findIndex(c => c.id === editingContactId);
        if (index !== -1) {
            contacts[index] = contact;
        }
    } else {
        // 添加新联系人
        contacts.push(contact);
    }
    
    // 保存到 localStorage
    localStorage.setItem('addressBookContacts', JSON.stringify(contacts));
    
    // 重置表单并关闭模态框
    resetForm();
    const modal = bootstrap.Modal.getInstance(document.getElementById('addContactModal'));
    modal.hide();
    
    // 重新渲染联系人
    renderContacts();
}

// 编辑联系人
function editContact(id) {
    const contact = contacts.find(c => c.id === id);
    if (!contact) return;
    
    editingContactId = id;
    
    // 填充表单
    document.getElementById('modalTitle').textContent = 'Edit Contact';
    document.getElementById('contactName').value = contact.name;
    document.getElementById('isBookmarked').checked = contact.isBookmarked;
    document.getElementById('contactNotes').value = contact.notes || '';
    document.getElementById('contactId').value = contact.id;
    
    // 清空并填充电话号码字段
    const phoneContainer = document.getElementById('phoneFields');
    phoneContainer.innerHTML = '';
    if (contact.phones && contact.phones.length > 0) {
        contact.phones.forEach(phone => {
            const div = document.createElement('div');
            div.className = 'input-group mb-2';
            div.innerHTML = `
                <input type="tel" class="form-control" value="${escapeHtml(phone.number)}">
                <select class="form-select" style="max-width: 120px;">
                    <option value="mobile" ${phone.type === 'mobile' ? 'selected' : ''}>Mobile</option>
                    <option value="home" ${phone.type === 'home' ? 'selected' : ''}>Home</option>
                    <option value="work" ${phone.type === 'work' ? 'selected' : ''}>Work</option>
                </select>
                <button type="button" class="btn btn-outline-danger" onclick="removeField(this, 'phone')">
                    <i class="bi bi-trash"></i>
                </button>
            `;
            phoneContainer.appendChild(div);
        });
    } else {
        addPhoneField();
    }
    
    // 清空并填充邮箱字段
    const emailContainer = document.getElementById('emailFields');
    emailContainer.innerHTML = '';
    if (contact.emails && contact.emails.length > 0) {
        contact.emails.forEach(email => {
            const div = document.createElement('div');
            div.className = 'input-group mb-2';
            div.innerHTML = `
                <input type="email" class="form-control" value="${escapeHtml(email.email)}">
                <select class="form-select" style="max-width: 120px;">
                    <option value="personal" ${email.type === 'personal' ? 'selected' : ''}>Personal</option>
                    <option value="work" ${email.type === 'work' ? 'selected' : ''}>Work</option>
                </select>
                <button type="button" class="btn btn-outline-danger" onclick="removeField(this, 'email')">
                    <i class="bi bi-trash"></i>
                </button>
            `;
            emailContainer.appendChild(div);
        });
    } else {
        addEmailField();
    }
    
    // 清空并填充标签
    const tagContainer = document.getElementById('tagContainer');
    tagContainer.innerHTML = '';
    if (contact.tags && contact.tags.length > 0) {
        contact.tags.forEach(tag => {
            const span = document.createElement('span');
            span.className = 'tag';
            span.innerHTML = `${escapeHtml(tag)} <i class="bi bi-x" onclick="removeTag(this)" style="cursor:pointer;"></i>`;
            tagContainer.appendChild(span);
        });
    }
    
    // 显示模态框
    const modal = new bootstrap.Modal(document.getElementById('addContactModal'));
    modal.show();
}

// 切换书签状态
function toggleBookmark(id) {
    const index = contacts.findIndex(c => c.id === id);
    if (index !== -1) {
        contacts[index].isBookmarked = !contacts[index].isBookmarked;
        localStorage.setItem('addressBookContacts', JSON.stringify(contacts));
        renderContacts();
    }
}

// 显示删除确认模态框
function showDeleteModal(id) {
    contactToDeleteId = id;
    const modal = new bootstrap.Modal(document.getElementById('deleteModal'));
    modal.show();
}

// 确认删除
function confirmDelete() {
    if (contactToDeleteId) {
        contacts = contacts.filter(c => c.id !== contactToDeleteId);
        localStorage.setItem('addressBookContacts', JSON.stringify(contacts));
        renderContacts();
        
        const modal = bootstrap.Modal.getInstance(document.getElementById('deleteModal'));
        modal.hide();
        contactToDeleteId = null;
    }
}

// 导出为Excel
function exportToExcel() {
    try {
        // 准备数据
        const data = contacts.map(contact => ({
            Name: contact.name,
            'Phone Numbers': contact.phones.map(p => `${p.number} (${p.type})`).join('\n'),
            'Email Addresses': contact.emails.map(e => `${e.email} (${e.type})`).join('\n'),
            Tags: contact.tags.join(', '),
            Bookmarked: contact.isBookmarked ? 'Yes' : 'No',
            Notes: contact.notes || '',
            'Created Date': new Date(contact.createdAt).toLocaleDateString()
        }));
        
        // 创建工作簿和工作表
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Contacts");
        
        // 设置列宽
        const wscols = [
            { wch: 20 }, // Name
            { wch: 30 }, // Phone Numbers
            { wch: 30 }, // Email Addresses
            { wch: 25 }, // Tags
            { wch: 10 }, // Bookmarked
            { wch: 40 }, // Notes
            { wch: 15 }  // Created Date
        ];
        ws['!cols'] = wscols;
        
        // 生成并下载文件
        XLSX.writeFile(wb, "contacts.xlsx");
        
    } catch (error) {
        alert('Error exporting to Excel: ' + error.message);
    }
}

// 导入JSON
function importFromJSON(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedContacts = JSON.parse(e.target.result);
            if (!Array.isArray(importedContacts)) {
                throw new Error('Invalid format: expected array of contacts');
            }
            
            // 合并导入的联系人（避免重复ID）
            importedContacts.forEach(newContact => {
                if (!newContact.id) newContact.id = Date.now().toString() + Math.random();
                const existingIndex = contacts.findIndex(c => c.id === newContact.id);
                if (existingIndex === -1) {
                    contacts.push(newContact);
                }
            });
            
            // 保存并重新渲染
            localStorage.setItem('addressBookContacts', JSON.stringify(contacts));
            renderContacts();
            
            alert(`Successfully imported ${importedContacts.length} contacts`);
            
        } catch (error) {
            alert('Error importing file: ' + error.message);
        }
    };
    
    reader.readAsText(file);
    event.target.value = '';
}

// 下载模板
function downloadTemplate() {
    const template = [
        {
            id: "1",
            name: "John Doe",
            phones: [
                { number: "123-456-7890", type: "mobile" },
                { number: "098-765-4321", type: "work" }
            ],
            emails: [
                { email: "john@example.com", type: "personal" },
                { email: "john.doe@company.com", type: "work" }
            ],
            tags: ["friend", "colleague"],
            isBookmarked: true,
            notes: "Met at conference last year",
            createdAt: new Date().toISOString()
        },
        {
            id: "2",
            name: "Jane Smith",
            phones: [
                { number: "555-123-4567", type: "home" }
            ],
            emails: [
                { email: "jane.smith@gmail.com", type: "personal" }
            ],
            tags: ["family"],
            isBookmarked: false,
            notes: "Cousin",
            createdAt: new Date().toISOString()
        }
    ];
    
    const dataStr = JSON.stringify(template, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = window.URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'contacts_template.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// 筛选联系人
function filterContacts(type) {
    currentFilter = type;
    
    // 更新按钮状态
    document.querySelectorAll('.btn-group .btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // 搜索筛选
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    let filtered = contacts;
    
    if (searchTerm) {
        filtered = contacts.filter(contact => 
            contact.name.toLowerCase().includes(searchTerm) ||
            (contact.phones && contact.phones.some(p => p.number.includes(searchTerm))) ||
            (contact.emails && contact.emails.some(e => e.email.toLowerCase().includes(searchTerm))) ||
            (contact.tags && contact.tags.some(t => t.toLowerCase().includes(searchTerm))) ||
            (contact.notes && contact.notes.toLowerCase().includes(searchTerm))
        );
    }
    
    renderContacts(filtered);
}

// 搜索功能
document.getElementById('searchInput').addEventListener('input', function() {
    filterContacts(currentFilter);
});

// 设置模态框事件
function setupModal() {
    const modal = document.getElementById('addContactModal');
    modal.addEventListener('hidden.bs.modal', resetForm);
}

// 重置表单
function resetForm() {
    document.getElementById('contactForm').reset();
    document.getElementById('phoneFields').innerHTML = '';
    document.getElementById('emailFields').innerHTML = '';
    document.getElementById('tagContainer').innerHTML = '';
    document.getElementById('modalTitle').textContent = 'Add New Contact';
    document.getElementById('contactId').value = '';
    editingContactId = null;
    
    // 添加默认字段
    addPhoneField();
    addEmailField();
}

// 防止XSS攻击
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}