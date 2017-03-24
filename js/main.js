//let apiKey = '0/cc880fedbaec6446c336f3178bbce1bf';


const pikWorkspaceId = '91610147640165';

let app = new Vue({
    el: '#app',
    data: {
        users: [],
        userInfo: null,
        sortAsc: true,
        workspaceId: pikWorkspaceId,
        apikey: localStorage.getItem('apikey') || ''
    },
    methods: {
        loadUsers: function () {
            this.users = [];
            localStorage.setItem('apikey', this.apikey);
            loadUsers(Asana.Client.create().useAccessToken(this.apikey), this.users);
        },
        showTaskInfo: function (userId) {
            this.userInfo = this.users.filter(u => u.id === userId)[0];
            $(window).scrollTop(0);
        },
        sortUsersBy: function (field) {
            this.sortAsc = !this.sortAsc;
            this.users = this.users.sort((a, b) => {
                return this.sortAsc ? a[field] - b[field] : b[field] - a[field];
            });
        },
        sortUsersByAlpha: function (field) {
            this.sortAsc = !this.sortAsc;
            this.users = this.users.sort((a, b) => {
                return this.sortAsc ? a[field].toLowerCase().localeCompare(b[field].toLowerCase())
                    : b[field].toLowerCase().localeCompare(a[field].toLowerCase());
            });
        },
        strimwidth: function (string, width) {
            if (string.length > width) {
                return string.slice(0, width) + '...';
            }
            return string;
        }
    }
});

let acceptCollection = (client, dest) => {
    let currentTimestamp = Date.parse(Date());
    return collection => {
        if(!collection) return;
        collection.data.forEach(
            user => {
                client.tasks.findAll({
                    assignee: user.id,
                    workspace: pikWorkspaceId,
                    opt_fields: ['completed', 'due_at', 'due_on', 'name'].join(',')
                }).then(collection => {
                    user.dueTasksCount = 0;
                    user.dueNotSetTasksCount = 0;
                    user.taskCount = collection.data.length;
                    user.tasks = collection.data.map(task => {
                        if (task.due_on) {
                            if (task.completed) {
                                task.isDue = false;
                            } else {
                                task.isDue = Date.parse(task.due_on) < currentTimestamp;
                                if(task.isDue) {
                                    user.dueTasksCount++;
                                }
                            }
                        } else {
                            user.dueNotSetTasksCount++;
                            task.isDue = false;
                        }
                        return task;
                    });
                    user.duePercent = user.taskCount === 0 ? 0 : ((user.dueTasksCount / user.taskCount)*100).toFixed(0);
                    dest.push(user);
                });
            }
        );
        return collection.nextPage();
    }
};

let loadUsers = (client, dest) => {
    client.users.findAll({workspace: pikWorkspaceId, limit: 100})
        .then(acceptCollection(client, dest))
        .then(acceptCollection(client, dest))
        .then(acceptCollection(client, dest));
};

