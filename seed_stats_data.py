import subprocess
import random
from datetime import datetime, timedelta

random.seed(42)
TOTAL = 5000
BATCH = 1000
cols = (
    "temps_id,patient_id,medecin_id,service_id,diagnostic_id,type_visite,mode_entree,"
    "date_entree,date_sortie,duree_sejour_h,tension_sys,tension_dia,temperature,spo2,"
    "glycemie,poids_kg,score_glasgow,mode_sortie,cout_actes,cout_medicaments,"
    "cout_hebergement,cout_total,prise_en_charge,montant_rembourse,reste_a_charge"
)
types = ["Consultation", "Urgence", "Hospitalisation"]
modes_e = ["Spontane", "Refere"]
modes_s = ["Gueri", "Ameliore", "Transfere"]
prises = ["RAMED", "AMO", "Mutuelles"]

for batch in range(0, TOTAL, BATCH):
    vals = []
    for _ in range(BATCH):
        jours = random.randint(1461, 1826)
        de = datetime(2020, 1, 1) + timedelta(days=jours, hours=random.randint(0, 23))
        ds = de + timedelta(hours=random.randint(1, 4))
        t = jours + 1
        p = random.randint(1, 38236)
        m = random.randint(1, 29)
        s = random.randint(1, 22)
        d = random.randint(1, 30)
        duree = round(random.uniform(0.3, 2.0), 1)
        glasgow = random.randint(12, 15)
        ca = round(random.uniform(150, 800), 2)
        cm = round(random.uniform(50, 300), 2)
        ch = 0
        ct = round(ca + cm, 2)
        rem = round(ct * 0.7, 2)
        reste = round(ct - rem, 2)
        vals.append(
            f"({t},{p},{m},{s},{d},'{random.choice(types)}','{random.choice(modes_e)}',"
            f"'{de.isoformat()}','{ds.isoformat()}',{duree},{random.randint(110, 140)},"
            f"{random.randint(70, 90)},{round(random.uniform(36.5, 37.5), 1)},"
            f"{random.randint(95, 100)},{round(random.uniform(4.5, 7.0), 1)},"
            f"{round(random.uniform(60, 90), 1)},{glasgow},'{random.choice(modes_s)}',"
            f"{ca},{cm},{ch},{ct},'{random.choice(prises)}',{rem},{reste})"
        )
    sql = f"INSERT INTO faits_consultation ({cols}) VALUES {','.join(vals)};"
    with open("batch.sql", "w", encoding="utf-8") as f:
        f.write(sql)
    subprocess.run(["docker", "cp", "batch.sql", "hopital_postgres:/tmp/batch.sql"], check=True)
    subprocess.run(
        ["docker", "exec", "hopital_postgres", "psql", "-U", "hopital_admin", "-d", "hopital_maroc", "-f", "/tmp/batch.sql"],
        check=True,
    )
    print(f"Inserted batch {batch // BATCH + 1}")

print("done", TOTAL)
