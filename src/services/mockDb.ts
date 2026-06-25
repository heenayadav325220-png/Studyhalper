export class MockDatabase {
  private users = [
    { id: 1, name: "defualt", points: 0, level: 1, avatar: null },
    { id: 2, name: "Alice Smith", points: 450, level: 5, avatar: null },
    { id: 3, name: "rendom", points: 320, level: 3, avatar: null },
    { id: 4, name: "Charlie Brown", points: 150, level: 2, avatar: null }
  ];
  private badges: any[] = [];
  private notes: any[] = [];
  private schedule: any[] = [];
  private progress: any[] = [];
  private groups: any[] = [];
  private group_members: any[] = [];
  private group_messages: any[] = [];
  private group_notes: any[] = [];

  constructor() {
    console.log("MockDatabase initialized in memory.");
  }

  exec(sql: string) {
    // Simply mock table execution
    return { success: true };
  }

  prepare(sql: string) {
    const normalized = sql.toLowerCase().replace(/\s+/g, ' ');

    return {
      run: (...args: any[]) => {
        let lastInsertRowid = Date.now();

        if (normalized.includes("insert into users")) {
          // INSERT OR IGNORE INTO users
          const id = args[0];
          const name = args[1];
          const points = args[2] || 0;
          const level = args[3] || 1;
          if (!this.users.find(u => u.id === id)) {
            this.users.push({ id, name, points, level, avatar: null });
          }
        } 
        else if (normalized.includes("update users set points = points + ?")) {
          const points = args[0];
          const userId = args[1];
          const user = this.users.find(u => u.id === Number(userId));
          if (user) {
            user.points += points;
          }
        } 
        else if (normalized.includes("update users set level =")) {
          const userId = args[0];
          const user = this.users.find(u => u.id === Number(userId));
          if (user) {
            user.level = Math.floor(user.points / 100) + 1;
          }
        } 
        else if (normalized.includes("insert into badges")) {
          const user_id = args[0];
          const badge_name = args[1];
          const icon = args[2];
          this.badges.push({
            id: this.badges.length + 1,
            user_id: Number(user_id),
            badge_name,
            icon,
            date_earned: new Date().toISOString()
          });
        } 
        else if (normalized.includes("insert into notes")) {
          const title = args[0];
          const content = args[1];
          const subject = args[2];
          const newNote = {
            id: this.notes.length + 1,
            title,
            content,
            subject,
            updated_at: new Date().toISOString()
          };
          this.notes.push(newNote);
          lastInsertRowid = newNote.id;
        } 
        else if (normalized.includes("update notes set title")) {
          const title = args[0];
          const content = args[1];
          const subject = args[2];
          const id = args[3];
          const note = this.notes.find(n => n.id === Number(id));
          if (note) {
            note.title = title;
            note.content = content;
            note.subject = subject;
            note.updated_at = new Date().toISOString();
          }
        } 
        else if (normalized.includes("delete from notes")) {
          const id = args[0];
          this.notes = this.notes.filter(n => n.id !== Number(id));
        } 
        else if (normalized.includes("insert into schedule")) {
          const task = args[0];
          const time = args[1];
          const day = args[2];
          const newItem = {
            id: this.schedule.length + 1,
            task,
            time,
            day,
            completed: 0
          };
          this.schedule.push(newItem);
          lastInsertRowid = newItem.id;
        } 
        else if (normalized.includes("update schedule set completed")) {
          const completed = args[0];
          const id = args[1];
          const item = this.schedule.find(s => s.id === Number(id));
          if (item) {
            item.completed = completed;
          }
        } 
        else if (normalized.includes("delete from schedule")) {
          const id = args[0];
          this.schedule = this.schedule.filter(s => s.id !== Number(id));
        } 
        else if (normalized.includes("insert into progress")) {
          const subject = args[0];
          const score = args[1];
          const total = args[2];
          this.progress.push({
            id: this.progress.length + 1,
            subject,
            score,
            total,
            date: new Date().toISOString()
          });
        } 
        else if (normalized.includes("insert into groups")) {
          const name = args[0];
          const description = args[1];
          const created_by = args[2];
          const newGroup = {
            id: this.groups.length + 1,
            name,
            description,
            created_by: Number(created_by),
            created_at: new Date().toISOString()
          };
          this.groups.push(newGroup);
          lastInsertRowid = newGroup.id;
        } 
        else if (normalized.includes("insert into group_members")) {
          const group_id = args[0];
          const user_id = args[1];
          const role = args[2] || 'member';
          if (!this.group_members.find(gm => gm.group_id === Number(group_id) && gm.user_id === Number(user_id))) {
            this.group_members.push({
              group_id: Number(group_id),
              user_id: Number(user_id),
              role
            });
          }
        } 
        else if (normalized.includes("insert into group_messages")) {
          const group_id = args[0];
          const user_id = args[1];
          const text = args[2];
          const image = args[3];
          const newMessage = {
            id: this.group_messages.length + 1,
            group_id: Number(group_id),
            user_id: Number(user_id),
            text,
            image,
            created_at: new Date().toISOString()
          };
          this.group_messages.push(newMessage);
          lastInsertRowid = newMessage.id;
        } 
        else if (normalized.includes("insert into group_notes")) {
          const group_id = args[0];
          const title = args[1];
          const content = args[2];
          const updated_by = args[3];
          const newGNote = {
            id: this.group_notes.length + 1,
            group_id: Number(group_id),
            title,
            content,
            updated_by: Number(updated_by),
            updated_at: new Date().toISOString()
          };
          this.group_notes.push(newGNote);
          lastInsertRowid = newGNote.id;
        } 
        else if (normalized.includes("update group_notes set title")) {
          const title = args[0];
          const content = args[1];
          const updated_by = args[2];
          const id = args[3];
          const gNote = this.group_notes.find(gn => gn.id === Number(id));
          if (gNote) {
            gNote.title = title;
            gNote.content = content;
            gNote.updated_by = Number(updated_by);
            gNote.updated_at = new Date().toISOString();
          }
        }

        return { lastInsertRowid, changes: 1 };
      },

      get: (...args: any[]) => {
        if (normalized.includes("select * from users where id = ?")) {
          const id = args[0];
          return this.users.find(u => u.id === Number(id)) || null;
        } 
        else if (normalized.includes("select id from badges")) {
          const user_id = args[0];
          const badge_name = args[1];
          return this.badges.find(b => b.user_id === Number(user_id) && b.badge_name === badge_name) || null;
        } 
        else if (normalized.includes("select name from users where id = ?")) {
          const id = args[0];
          const user = this.users.find(u => u.id === Number(id));
          return user ? { name: user.name } : null;
        }
        return null;
      },

      all: (...args: any[]) => {
        if (normalized.includes("select * from badges where user_id = ?")) {
          const user_id = args[0];
          return this.badges.filter(b => b.user_id === Number(user_id));
        } 
        else if (normalized.includes("select name, points, level from users")) {
          return [...this.users]
            .sort((a, b) => b.points - a.points)
            .slice(0, 10)
            .map(u => ({ name: u.name, points: u.points, level: u.level }));
        } 
        else if (normalized.includes("select * from notes")) {
          return [...this.notes].sort((a, b) => b.updated_at.localeCompare(a.updated_at));
        } 
        else if (normalized.includes("select * from schedule")) {
          return [...this.schedule];
        } 
        else if (normalized.includes("select * from progress")) {
          return [...this.progress].sort((a, b) => b.date.localeCompare(a.date));
        } 
        else if (normalized.includes("select g.*")) {
          if (normalized.includes("join group_members gm")) {
            // User groups
            const userId = args[0];
            const joinedGroupIds = this.group_members
              .filter(gm => gm.user_id === Number(userId))
              .map(gm => gm.group_id);
            return this.groups
              .filter(g => joinedGroupIds.includes(g.id))
              .map(g => ({
                ...g,
                member_count: this.group_members.filter(gm => gm.group_id === g.id).length
              }));
          } else {
            // All groups
            return this.groups.map(g => ({
              ...g,
              member_count: this.group_members.filter(gm => gm.group_id === g.id).length
            }));
          }
        } 
        else if (normalized.includes("select gm.*, u.name")) {
          const group_id = args[0];
          return this.group_messages
            .filter(gm => gm.group_id === Number(group_id))
            .map(gm => {
              const u = this.users.find(user => user.id === gm.user_id);
              return {
                ...gm,
                user_name: u ? u.name : "Unknown Student"
              };
            })
            .sort((a, b) => a.created_at.localeCompare(b.created_at));
        } 
        else if (normalized.includes("select gn.*, u.name")) {
          const group_id = args[0];
          return this.group_notes
            .filter(gn => gn.group_id === Number(group_id))
            .map(gn => {
              const u = this.users.find(user => user.id === gn.updated_by);
              return {
                ...gn,
                updated_by_name: u ? u.name : "Unknown Student"
              };
            })
            .sort((a, b) => b.updated_at.localeCompare(a.updated_at));
        }

        return [];
      }
    };
  }
}
