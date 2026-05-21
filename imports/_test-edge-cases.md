# #welcome

*1 pinned message(s).*

### TestUser — May 21, 2026, 10:00 AM

Edge case fixture — see how the ingest handles tricky input. *(edited)*

Code block containing a Python comment that starts with `#` and a CSS color literal:

```python
# This is a comment, not a channel reference
color = "#ff8800"
print("hello")
```

A reference to **#suboxone-info** should become an internal link. A bare
reference to #paws should also link. But the `#ff8800` inside the code block
above should be left alone.

Emoji test :warning: and :pray: render as unicode. Unknown :totally-fake-name:
stays as-is.

A user mention like @discord_user_99 should be anonymized.

---

# #for-loved-ones

### AnotherUser — May 20, 2026, 9:00 PM

## For Loved Ones

This is a second channel in the same export file. The ingest should split it
into a separate output file.

- Bullet one
- Bullet two
