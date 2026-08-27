
import openpyxl, json
wb = openpyxl.load_workbook(r"C:\Users\I'm Not Diyarayaa\Desktop\GITHUB\project-bct/../HERMES PROJECT/2026 BEST COMPUTEL RMA & SERVICE v1.0.xlsx".replace('/c/../','/c/Users/I\'m Not Diyarayaa/Desktop/'), read_only=True, data_only=True)
ws = wb['DB']
rows = list(ws.iter_rows(values_only=True))
hdr = rows[0]
out = []
for r in rows[1:]:
    if not r or str(r[0]).strip().startswith('BCTRS') is False:
        continue
    out.append([str(c).strip() if c is not None else '' for c in r])
json.dump(out, open(r"C:/Users/I'm Not Diyarayaa/Desktop/GITHUB/project-bct/scripts/_db_rows.json", 'w'))
print('rows:', len(out))
