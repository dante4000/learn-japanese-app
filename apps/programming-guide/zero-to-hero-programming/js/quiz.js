/* Knowledge check quizzes — multiple choice with instant feedback */
(function () {
  function initQuizzes() {
    document.querySelectorAll('.quiz').forEach(function (quiz) {
      var ch = quiz.getAttribute('data-ch');
      var ex = quiz.getAttribute('data-ex');
      var options = quiz.querySelectorAll('.quiz-option');
      var feedback = quiz.querySelector('.quiz-feedback');

      /* Restore completed state */
      if (window.ZTH && window.ZTH.progress && window.ZTH.progress.isComplete(ch, ex)) {
        options.forEach(function (opt) {
          opt.classList.add('selected');
          if (opt.getAttribute('data-correct') === 'true') {
            opt.classList.add('correct');
          }
        });
        if (feedback) {
          feedback.className = 'quiz-feedback visible';
          feedback.textContent = 'Completed!';
          feedback.style.color = 'var(--a3)';
        }
        return;
      }

      options.forEach(function (opt) {
        opt.addEventListener('click', function () {
          if (quiz.querySelector('.quiz-option.selected')) return;

          var isCorrect = opt.getAttribute('data-correct') === 'true';

          options.forEach(function (o) { o.classList.add('selected'); });
          options.forEach(function (o) {
            if (o.getAttribute('data-correct') === 'true') o.classList.add('correct');
          });

          if (isCorrect) {
            if (feedback) {
              feedback.className = 'quiz-feedback visible';
              feedback.textContent = 'Correct!';
              feedback.style.color = 'var(--a3)';
            }
            if (ch && ex && window.ZTH && window.ZTH.progress) {
              window.ZTH.progress.markComplete(ch, ex);
            }
          } else {
            opt.classList.add('incorrect');
            if (feedback) {
              feedback.className = 'quiz-feedback visible';
              feedback.textContent = 'Not quite. The correct answer is highlighted.';
              feedback.style.color = 'var(--a5)';
            }
          }
        });
      });
    });
  }

  window.ZTH = window.ZTH || {};
  window.ZTH.quiz = { init: initQuizzes };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initQuizzes);
  } else {
    initQuizzes();
  }
})();
