from flask import Flask, request, jsonify, render_template, redirect, send_file, session
from flask_cors import CORS
from twilio.rest import Client
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import csv, os, re
from datetime import datetime
from threading import Thread
from flask import session

import re

app = Flask(__name__)
CORS(app)

# ===== TWILIO CONFIG =====
TWILIO_SID = "AC184f4ce84bb01197be0ade8c1eefd792"
TWILIO_AUTH = "4fb153ddce1cf948035f18917c9fb68f"
TWILIO_WHATSAPP = "whatsapp:+14155238886"
ADMIN_WHATSAPP = "whatsapp:+917734003377"

client = Client(TWILIO_SID, TWILIO_AUTH)

# ===== EMAIL CONFIG =====
ADMIN_EMAIL = "houseofastrovastu@gmail.com"        # admin email
EMAIL_PASSWORD = "saja mssq odfp dlte"  # gmail app password

SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587

# ===== ADMIN LOGIN =====
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "astro123"   # change this
app.secret_key = "supersecretkey123"

# ================= HOME PAGE =================
@app.route("/")
def home():
    return render_template("index.html")


# ================= ADMIN LOGIN PAGE =================
@app.route("/admin", methods=["GET", "POST"])
def admin_login():
    if request.method == "POST":
        username = request.form.get("username")
        password = request.form.get("password")

        if username == ADMIN_USERNAME and password == ADMIN_PASSWORD:
            session["admin"] = True
            return redirect("/dashboard")
        else:
            return "Invalid Login", 401

    return render_template("admin_login.html")


# ================= ADMIN DASHBOARD =================
@app.route("/dashboard")
def dashboard():
    if not session.get("admin"):
        return redirect("/admin")
    return render_template("admin_dashboard.html")


# ================= DOWNLOAD FILES =================
@app.route("/download/<filename>")
def download_file(filename):
    if not session.get("admin"):
        return redirect("/admin")
    return send_file(filename, as_attachment=True)

# ================= DELETE FILE =================
@app.route("/delete/<filename>")
def delete_file(filename):
    if not session.get("admin"):
        return redirect("/admin")

    if os.path.exists(filename):
        os.remove(filename)
        return f"{filename} deleted successfully"

    return "File not found"

# ================= LOGOUT =================
@app.route("/logout")
def logout():
    session.pop("admin", None)
    return redirect("/admin")

# ================= SAVE CSV =================
def save_lead(filename, headers, row):
    file_exists = os.path.exists(filename)

    with open(filename, "a", newline="") as f:
        writer = csv.writer(f)
        if not file_exists:
            writer.writerow(headers)
        writer.writerow(row)


# ================= EMAIL FUNCTION =================
def send_email(to_email, subject, body):
    msg = MIMEMultipart()
    msg["From"] = ADMIN_EMAIL
    msg["To"] = to_email
    msg["Subject"] = subject
    msg.attach(MIMEText(body, "plain"))

    server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
    server.starttls()
    server.login(ADMIN_EMAIL, EMAIL_PASSWORD)
    server.sendmail(ADMIN_EMAIL, to_email, msg.as_string())
    server.quit()


# ================= CLEAN PHONE =================
def normalize_phone(phone):
    phone = re.sub(r"[^\d+]", "", phone)
    if not phone.startswith("+"):
        phone = "+" + phone
    return phone



# ================= BACKGROUND TASK =================
def process_background(data):
    name = data["name"]
    email = data["email"]
    country_code = data.get("country_code", "+91")
    raw_phone = data.get("phone", "")
    phone = normalize_phone(country_code + raw_phone)
    service = data.get("service", "")
    form_type = data.get("form_type", "online")

    message = data.get("message", "")
    address = data.get("address", "")
    city = data.get("city", "")
    state = data.get("state", "")
    country = data.get("country", "")
    pincode = data.get("pincode", "")

    timestamp = datetime.now()

    # Save CSV
    if form_type == "online":
        save_lead("online_leads.csv",
                  ["Time", "Name", "Email", "Phone", "Service", "Message"],
                  [timestamp, name, email, phone, service, message])
    else:
        save_lead("offline_leads.csv",
                  ["Time", "Name", "Email", "Phone", "Service", "Address", "City", "State", "Country", "Pincode"],
                  [timestamp, name, email, phone, service, address, city, state, country, pincode])

    # EMAIL USER
    user_email_body = f"""
Hi {name},

We received your consultation request for {service}.
Our team will contact you soon.

Regards,
The House of AstroVastu
"""
    send_email(email, "Consultation Request Received", user_email_body)

#=========== EMAIL ADMIN==============
    admin_email_body = f"""
NEW {form_type.upper()} CONSULTATION

Name: {name}
Email: {email}
Phone: {phone}
Service: {service}
Message: {message}

Address: {address}
City: {city}
State: {state}
Country: {country}
Pincode: {pincode}
"""
    send_email(ADMIN_EMAIL, "New Consultation Lead", admin_email_body)

#=========== WHATSAPP USER ============
    print("Sending WhatsApp to:", phone)
    client.messages.create(
        from_=TWILIO_WHATSAPP,
        to=f"whatsapp:{phone}",
        body=f"Hi {name}, we received your consultation request. Team AstroVastu will contact you soon."
    )

    # WHATSAPP ADMIN
    client.messages.create(
        from_=TWILIO_WHATSAPP,
        to=ADMIN_WHATSAPP,
        body=f"NEW {form_type.upper()} LEAD:\n{name}\n{email}\n{phone}\nService: {service}"
    )


# ================= FORM API =================

@app.route("/submit", methods=["POST"])
def submit():
    data = request.json
    email = data.get("email")
    now = datetime.now().timestamp()

    if "last_submit" in session and now - session["last_submit"] < 3:
        return jsonify({"status": "duplicate"})

    session["last_submit"] = now

    Thread(target=process_background, args=(data,)).start()
    return jsonify({"status": "success"})



# ================= RUN SERVER =================
if __name__ == "__main__":
    app.run(debug=True, use_reloader=False)
