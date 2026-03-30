# taskforge.py — v0.1
# A minimal command-line task manager

tasks = []

def add_task(description):
    task = {"id": len(tasks) + 1, "description": description, "status": "pending"}
    tasks.append(task)
    return task

def complete_task(task_id):
    for task in tasks:
        if task["id"] == task_id:
            task["status"] = "complete"
            return task
    return None

def list_tasks():
    return tasks

def main():
    while True:
        command = input("\nTaskForge> ").strip().lower()
        if command == "add":
            desc = input("Description: ")
            task = add_task(desc)
            print(f"Added: #{task['id']} — {task['description']}")
        elif command == "done":
            task_id = int(input("Task ID: "))
            result = complete_task(task_id)
            if result:
                print(f"Completed: #{result['id']}")
            else:
                print("Task not found.")
        elif command == "list":
            for t in list_tasks():
                status = "✓" if t["status"] == "complete" else " "
                print(f"  [{status}] #{t['id']} — {t['description']}")
        elif command == "quit":
            break
        else:
            print("Commands: add, done, list, quit")

if __name__ == "__main__":
    main()
