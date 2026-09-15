import os
import sqlite3

from flask import Flask, jsonify, render_template, request

app = Flask(__name__)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATABASE = os.path.join(BASE_DIR, "database.db")


def get_db():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_db()
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """
    )
    conn.commit()
    conn.close()


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/users", methods=["GET"])
def list_users():
    conn = get_db()
    rows = conn.execute("SELECT * FROM users ORDER BY id DESC").fetchall()
    conn.close()
    return jsonify([dict(row) for row in rows])


@app.route("/api/users/<int:user_id>", methods=["GET"])
def get_user(user_id):
    conn = get_db()
    row = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    conn.close()
    if row is None:
        return jsonify({"error": "Usuário não encontrado"}), 404
    return jsonify(dict(row))


@app.route("/api/users", methods=["POST"])
def create_user():
    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip()

    if not name or not email:
        return jsonify({"error": "Nome e email são obrigatórios"}), 400

    conn = get_db()
    try:
        cursor = conn.execute(
            "INSERT INTO users (name, email) VALUES (?, ?)", (name, email)
        )
        conn.commit()
        row = conn.execute(
            "SELECT * FROM users WHERE id = ?", (cursor.lastrowid,)
        ).fetchone()
        return jsonify(dict(row)), 201
    except sqlite3.IntegrityError:
        return jsonify({"error": "Este email já está cadastrado"}), 409
    finally:
        conn.close()


@app.route("/api/users/<int:user_id>", methods=["PUT"])
def update_user(user_id):
    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip()

    if not name or not email:
        return jsonify({"error": "Nome e email são obrigatórios"}), 400

    conn = get_db()
    exists = conn.execute("SELECT id FROM users WHERE id = ?", (user_id,)).fetchone()
    if exists is None:
        conn.close()
        return jsonify({"error": "Usuário não encontrado"}), 404

    try:
        conn.execute(
            "UPDATE users SET name = ?, email = ? WHERE id = ?",
            (name, email, user_id),
        )
        conn.commit()
        row = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
        return jsonify(dict(row))
    except sqlite3.IntegrityError:
        return jsonify({"error": "Este email já está cadastrado"}), 409
    finally:
        conn.close()


@app.route("/api/users/<int:user_id>", methods=["DELETE"])
def delete_user(user_id):
    conn = get_db()
    exists = conn.execute("SELECT id FROM users WHERE id = ?", (user_id,)).fetchone()
    if exists is None:
        conn.close()
        return jsonify({"error": "Usuário não encontrado"}), 404

    conn.execute("DELETE FROM users WHERE id = ?", (user_id,))
    conn.commit()
    conn.close()
    return jsonify({"message": "Usuário removido com sucesso"})


init_db()

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    app.run(host="0.0.0.0", port=port, debug=True)
